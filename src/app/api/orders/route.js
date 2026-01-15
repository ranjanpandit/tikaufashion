import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getCustomerFromRequest } from "@/lib/customerAuth";
import Coupon from "@/models/Coupon";

export async function POST(req) {
  await connectMongo();

  const data = await req.json();
  const customer = await getCustomerFromRequest();
  console.log("ORDER COUPON PATH TYPE:", Order.schema.path("coupon"));

  /* =========================
     CREATE ORDER
  ========================== */
  const order = await Order.create({
    customerId: customer?.id || null,

    customer: {
      name: data.customer?.name,
      email: data.customer?.email,
      phone: data.customer?.phone,
    },

    address: {
      line1: data.address?.line1,
      city: data.address?.city,
      state: data.address?.state,
      pincode: data.address?.pincode,
    },

    items: data.items.map((i) => ({
      cartId: i.cartId,
      productId: i.productId,
      slug: i.slug,
      name: i.name,
      price: i.price,
      qty: i.qty,
      image: i.image,
      selectedOptions: i.selectedOptions,
    })),

    subtotal: data.subtotal,
    discount: data.discount,

    coupon: data.coupon
      ? {
          code: data.coupon.code,
          couponType: data.coupon.type, // 🔥 mapped
          value: data.coupon.value,
        }
      : undefined,

    total: data.total,

    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentMethod === "COD" ? "pending" : "paid",

    razorpayOrderId: data.razorpayOrderId || null,
    razorpayPaymentId: data.razorpayPaymentId || null,
  });

  /* =========================
     UPDATE COUPON USAGE
  ========================== */
  if (data?.coupon?.code) {
    await Coupon.updateOne(
      { code: data.coupon.code },
      { $inc: { usedCount: 1 } }
    );
  }

  return NextResponse.json({
    success: true,
    orderId: order._id,
  });
}
