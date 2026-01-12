import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getCustomerFromRequest } from "@/lib/customerAuth";
import Coupon from "@/models/Coupon";

export async function POST(req) {
  await connectMongo();

  const data = await req.json();
  const customer = await getCustomerFromRequest();
  if (data?.coupon) {
    await Coupon.updateOne(
      { code: data.coupon },
      { $inc: { usedCount: 1 } }
    );
  }
  const order = await Order.create({
    customerId: customer?.id || null, // 🔥 KEY PART
    customer: data.customer,
    address: data.address,
    items: data.items,
    total: data.total,
    paymentMethod: data.paymentMethod,
    razorpayOrderId: data.razorpayOrderId,
    razorpayPaymentId: data.razorpayPaymentId,
  });

  return NextResponse.json({ success: true, orderId: order._id });
}
