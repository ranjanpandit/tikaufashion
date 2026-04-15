import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import {
  buildGatewayOrderRecord,
  checkGatewayPaymentStatus,
  getPaymentGatewayMeta,
  sendPayoutWebhook,
} from "@/lib/mini-payment-gateway";

export async function POST(req) {
  try {
    await connectMongo();

    const body = await req.json();
    const { orderId, refId, serviceId } = body || {};

    if (!orderId) {
      return NextResponse.json({ message: "Missing orderId" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    const gatewayMeta = getPaymentGatewayMeta();
    if (gatewayMeta.provider !== "openmoney") {
      return NextResponse.json(
        { message: `Status check is not enabled for provider ${gatewayMeta.provider}` },
        { status: 400 }
      );
    }

    if (String(order.paymentStatus || "").toUpperCase() === "PAID") {
      return NextResponse.json({
        success: true,
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        statusCheck: { skipped: true, reason: "Order already paid" },
      });
    }

    const resolvedRefId = String(
      refId ||
        order.paymentGateway?.providerOrderId ||
        order.paymentGateway?.receipt ||
        order.receipt ||
        order.razorpayOrderId ||
        ""
    ).trim();

    if (!resolvedRefId) {
      return NextResponse.json(
        { message: "RefId is missing for status check" },
        { status: 400 }
      );
    }

    const result = await checkGatewayPaymentStatus({
      refId: resolvedRefId,
      serviceId: serviceId || process.env.OPENMONEY_STATUS_SERVICE_ID || 1,
    });

    const checkedStatus = String(result.status || "PENDING").toUpperCase();
    const previousStatus = String(order.paymentStatus || "PENDING").toUpperCase();
    const nextPaymentStatus =
      checkedStatus === "PAID"
        ? "PAID"
        : checkedStatus === "FAILED"
        ? "FAILED"
        : "PENDING";

    order.paymentStatus = nextPaymentStatus;
    order.paymentGateway = buildGatewayOrderRecord({
      platformOrderId: order.paymentGateway?.platformOrderId || null,
      platformGatewayCode:
        order.paymentGateway?.platformGatewayCode ||
        String(gatewayMeta.provider || "").toUpperCase(),
      providerOrderId: resolvedRefId,
      providerPaymentId: result.utr || order.paymentGateway?.providerPaymentId || null,
      signature: order.paymentGateway?.signature || null,
      receipt: order.paymentGateway?.receipt || order.receipt || resolvedRefId,
      status: nextPaymentStatus,
      verifiedAt:
        nextPaymentStatus === "PAID"
          ? order.paymentVerifiedAt || new Date()
          : order.paymentGateway?.verifiedAt || null,
      syncStatus: "DELIVERED",
      syncMessage: "Payment status synced via OpenMoney status-check API.",
    });

    if (nextPaymentStatus === "PAID") {
      const paidAt = order.paymentVerifiedAt || new Date();
      order.paymentVerifiedAt = paidAt;
      order.razorpayPaymentId = result.utr || order.razorpayPaymentId;
    }

    if (nextPaymentStatus === "FAILED") {
      order.razorpayPaymentId = result.utr || order.razorpayPaymentId;
    }

    await order.save();

    if (previousStatus !== nextPaymentStatus) {
      const payoutStatusId =
        nextPaymentStatus === "PAID" ? 1 : nextPaymentStatus === "FAILED" ? 3 : 2;
      const payoutMessage =
        nextPaymentStatus === "PAID"
          ? "Payment success"
          : nextPaymentStatus === "FAILED"
          ? "Payment failed"
          : "Payment pending";

      try {
        await sendPayoutWebhook({
          statusId: payoutStatusId,
          amount: Number(order.total || 0),
          utr: result.utr || resolvedRefId,
          clientId: String(order.customerId || order.customer?.phone || ""),
          message: payoutMessage,
        });
      } catch (payoutError) {
        console.error("PAYOUT WEBHOOK STATUS-CHECK SYNC ERROR:", payoutError);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      statusCheck: {
        refId: resolvedRefId,
        serviceId: String(serviceId || process.env.OPENMONEY_STATUS_SERVICE_ID || 1),
        gatewayStatus: checkedStatus,
        utr: result.utr || null,
      },
    });
  } catch (err) {
    console.error("PAYMENT STATUS CHECK ERROR:", err);
    return NextResponse.json(
      { message: "Payment status check failed", error: err?.message },
      { status: 500 }
    );
  }
}

