import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function POST(req) {
  try {
    await connectMongo();

    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (expected !== signature) {
      return NextResponse.json({ message: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // ✅ payment captured event
    if (event?.event === "payment.captured") {
      const payment = event.payload.payment.entity;

      // ✅ You can match by razorpay_order_id
      const razorpayOrderId = payment.order_id;

      const order = await Order.findOne({ razorpayOrderId });

      if (order && order.paymentStatus !== "PAID") {
        order.paymentStatus = "PAID";
        order.razorpayPaymentId = payment.id;
        order.paymentVerifiedAt = new Date();
        await order.save();
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return NextResponse.json({ message: "Webhook error" }, { status: 500 });
  }
}
