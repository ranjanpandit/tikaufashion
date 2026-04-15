import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import {
  buildGatewayOrderRecord,
  sendPayoutWebhook,
  syncPlatformOrderStatus,
} from "@/lib/mini-payment-gateway";

export async function POST(req) {
  try {
    await connectMongo();

    const body = await req.json();
    const { orderId, reason, gatewayOrderId, gatewayPaymentId, status } = body;

    if (!orderId) {
      return NextResponse.json({ message: "Missing orderId" }, { status: 400 });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const finalStatus = status === "CANCELLED" ? "CANCELLED" : "FAILED";
    let syncStatus = order.paymentGateway?.syncStatus || "PENDING";
    let syncMessage = order.paymentGateway?.syncMessage || "";

    if (order.paymentGateway?.platformOrderId) {
      try {
        await syncPlatformOrderStatus({
          platformOrderId: order.paymentGateway.platformOrderId,
          gatewayCode: order.paymentGateway.platformGatewayCode || "RAZORPAY",
          status: finalStatus,
          gatewayOrderId:
            gatewayOrderId || order.paymentGateway?.providerOrderId || order.razorpayOrderId,
          gatewayPaymentId: gatewayPaymentId || "",
          payerName: order.customer?.name || "",
          payerReference: gatewayPaymentId || "",
          description: `Tikau Fashion order ${order._id}`,
          amount: Number(order.total || 0),
          reason: reason || "Checkout failed before payment capture.",
        });
        syncStatus = "DELIVERED";
        syncMessage = `Failure synced to Mini Payment Gateway platform as ${finalStatus}.`;
      } catch (syncError) {
        console.error("PLATFORM PAYMENT FAILURE SYNC ERROR:", syncError);
        syncStatus = "FAILED";
        syncMessage = syncError?.message || "Platform failure sync failed.";
      }
    }

    order.paymentStatus = "FAILED";
    order.paymentGateway = buildGatewayOrderRecord({
      platformOrderId: order.paymentGateway?.platformOrderId || null,
      platformGatewayCode: order.paymentGateway?.platformGatewayCode || "RAZORPAY",
      providerOrderId:
        gatewayOrderId || order.paymentGateway?.providerOrderId || order.razorpayOrderId,
      providerPaymentId: gatewayPaymentId || order.paymentGateway?.providerPaymentId || null,
      receipt: order.paymentGateway?.receipt || order.receipt || null,
      status: finalStatus,
      syncStatus,
      syncMessage,
    });

    await order.save();

    try {
      await sendPayoutWebhook({
        statusId: 3,
        amount: Number(order.total || 0),
        utr:
          gatewayPaymentId ||
          order.paymentGateway?.providerPaymentId ||
          gatewayOrderId ||
          order.paymentGateway?.providerOrderId ||
          order.razorpayOrderId ||
          "",
        clientId: String(order.customerId || order.customer?.phone || ""),
        message:
          reason ||
          (finalStatus === "CANCELLED" ? "Payment cancelled" : "Payment failed"),
      });
    } catch (payoutError) {
      console.error("PAYOUT WEBHOOK FAILURE SYNC ERROR:", payoutError);
    }

    return NextResponse.json({
      success: true,
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      syncStatus,
    });
  } catch (err) {
    console.error("PAYMENT FAIL ERROR:", err);
    return NextResponse.json(
      { message: "Failed to store failed payment", error: err?.message },
      { status: 500 }
    );
  }
}
