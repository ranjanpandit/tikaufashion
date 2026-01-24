import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import Razorpay from "razorpay";

export async function POST(req) {
  try {
    await connectMongo();

    const body = await req.json();

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!orderId) {
      return NextResponse.json({ message: "Missing orderId" }, { status: 400 });
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ message: "Invalid payment data" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // ✅ Prevent mismatch attack
    if (order.razorpayOrderId !== razorpay_order_id) {
      return NextResponse.json({ message: "Order mismatch" }, { status: 400 });
    }

    // ✅ Signature verify
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json({ message: "Signature mismatch" }, { status: 400 });
    }

    // ✅ Optional: fetch payment from Razorpay for extra validation (enterprise)
    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (!payment || payment.status !== "captured") {
      return NextResponse.json(
        { message: "Payment not captured yet", status: payment?.status || "unknown" },
        { status: 400 }
      );
    }

    // ✅ mark paid
    order.paymentStatus = "PAID";
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentVerifiedAt = new Date();
    await order.save();

    return NextResponse.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error("PAYMENT VERIFY ERROR:", err);
    return NextResponse.json(
      { message: "Payment verification failed", error: err?.message },
      { status: 500 }
    );
  }
}
