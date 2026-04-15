import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import {
  buildGatewayOrderRecord,
  confirmPlatformOrderPayment,
  fetchGatewayPayment,
  sendPayoutWebhook,
  verifyGatewayPaymentSignature,
} from "@/lib/mini-payment-gateway";

export async function POST(req) {
  try {
    await connectMongo();

    const body = await req.json();
    const {
      orderId,
      provider_order_id,
      provider_payment_id,
      provider_signature,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = body;

    const gatewayOrderId = provider_order_id || razorpay_order_id;
    const gatewayPaymentId = provider_payment_id || razorpay_payment_id;
    const gatewaySignature = provider_signature || razorpay_signature;

    if (!orderId) {
      return NextResponse.json({ message: "Missing orderId" }, { status: 400 });
    }

    if (!gatewayOrderId || !gatewayPaymentId || !gatewaySignature) {
      return NextResponse.json({ message: "Invalid payment data" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const expectedProviderOrderId =
      order.paymentGateway?.providerOrderId || order.razorpayOrderId;

    if (expectedProviderOrderId !== gatewayOrderId) {
      return NextResponse.json({ message: "Order mismatch" }, { status: 400 });
    }

    if (
      !verifyGatewayPaymentSignature({
        providerOrderId: gatewayOrderId,
        providerPaymentId: gatewayPaymentId,
        signature: gatewaySignature,
      })
    ) {
      return NextResponse.json({ message: "Signature mismatch" }, { status: 400 });
    }

    const payment = await fetchGatewayPayment(gatewayPaymentId);

    if (!payment || payment.status !== "captured") {
      return NextResponse.json(
        { message: "Payment not captured yet", status: payment?.status || "unknown" },
        { status: 400 }
      );
    }

    const verifiedAt = new Date();
    let syncStatus = order.paymentGateway?.syncStatus || "PENDING";
    let syncMessage = order.paymentGateway?.syncMessage || "";

    if (order.paymentGateway?.platformOrderId) {
      try {
        await confirmPlatformOrderPayment({
          platformOrderId: order.paymentGateway.platformOrderId,
          gatewayCode: order.paymentGateway.platformGatewayCode || "RAZORPAY",
          gatewayOrderId,
          gatewayPaymentId,
          signature: gatewaySignature,
          payerName: order.customer?.name || "",
          payerReference: gatewayPaymentId,
          description: `Tikau Fashion order ${order._id}`,
          amount: Number(order.total || 0),
        });
        syncStatus = "DELIVERED";
        syncMessage = "Payment synced to Mini Payment Gateway platform.";
      } catch (syncError) {
        console.error("PLATFORM PAYMENT SYNC ERROR:", syncError);
        syncStatus = "FAILED";
        syncMessage = syncError?.message || "Platform sync failed.";
      }
    }

    order.paymentStatus = "PAID";
    order.paymentGateway = buildGatewayOrderRecord({
      platformOrderId: order.paymentGateway?.platformOrderId || null,
      platformGatewayCode: order.paymentGateway?.platformGatewayCode || "RAZORPAY",
      providerOrderId: gatewayOrderId,
      providerPaymentId: gatewayPaymentId,
      signature: gatewaySignature,
      receipt: order.paymentGateway?.receipt || order.receipt || null,
      status: "PAID",
      verifiedAt,
      syncStatus,
      syncMessage,
    });
    order.razorpayPaymentId = gatewayPaymentId;
    order.razorpaySignature = gatewaySignature;
    order.paymentVerifiedAt = verifiedAt;
    await order.save();

    try {
      await sendPayoutWebhook({
        statusId: 1,
        amount: Number(order.total || 0),
        utr: gatewayPaymentId || gatewayOrderId || "",
        clientId: String(order.customerId || order.customer?.phone || ""),
        message: "Payment success",
      });
    } catch (payoutError) {
      console.error("PAYOUT WEBHOOK SUCCESS SYNC ERROR:", payoutError);
    }

    return NextResponse.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error("PAYMENT VERIFY ERROR:", err);
    return NextResponse.json(
      { message: "Payment verification failed", error: err?.message },
      { status: 500 }
    );
  }
}
