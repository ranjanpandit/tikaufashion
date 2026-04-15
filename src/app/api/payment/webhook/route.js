import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import {
  buildGatewayOrderRecord,
  getPaymentGatewayMeta,
  verifyGatewayWebhookSignature,
} from "@/lib/mini-payment-gateway";

export async function POST(req) {
  try {
    await connectMongo();
    const gatewayMeta = getPaymentGatewayMeta();

    if (gatewayMeta.provider !== "razorpay") {
      return NextResponse.json({
        success: true,
        message: `Webhook ignored for provider ${gatewayMeta.provider}`,
      });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!verifyGatewayWebhookSignature({ rawBody, signature })) {
      return NextResponse.json({ message: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event?.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const order = await Order.findOne({ razorpayOrderId });

      if (order && order.paymentStatus !== "PAID") {
        const verifiedAt = new Date();

        order.paymentStatus = "PAID";
        order.paymentGateway = buildGatewayOrderRecord({
          platformOrderId: order.paymentGateway?.platformOrderId || null,
          platformGatewayCode: order.paymentGateway?.platformGatewayCode || "RAZORPAY",
          providerOrderId: razorpayOrderId,
          providerPaymentId: payment.id,
          receipt: order.paymentGateway?.receipt || order.receipt || null,
          status: "PAID",
          verifiedAt,
          syncStatus: order.paymentGateway?.syncStatus || "PENDING",
          syncMessage:
            order.paymentGateway?.syncMessage ||
            "Waiting for explicit client-side payment confirmation sync.",
        });
        order.razorpayPaymentId = payment.id;
        order.paymentVerifiedAt = verifiedAt;
        await order.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return NextResponse.json({ message: "Webhook error" }, { status: 500 });
  }
}
