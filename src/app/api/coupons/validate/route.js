import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export async function POST(req) {
  await connectMongo();

  const { code, subtotal } = await req.json();

  if (!code)
    return NextResponse.json(
      { message: "Coupon code required" },
      { status: 400 }
    );

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!coupon)
    return NextResponse.json(
      { message: "Invalid coupon" },
      { status: 400 }
    );

  if (coupon.expiresAt < new Date())
    return NextResponse.json(
      { message: "Coupon expired" },
      { status: 400 }
    );

  if (subtotal < coupon.minOrder)
    return NextResponse.json(
      {
        message: `Minimum order ₹${coupon.minOrder}`,
      },
      { status: 400 }
    );

  if (
    coupon.usageLimit &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return NextResponse.json(
      { message: "Coupon usage limit reached" },
      { status: 400 }
    );
  }

  let discount =
    coupon.type === "percentage"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

  if (coupon.maxDiscount) {
    discount = Math.min(discount, coupon.maxDiscount);
  }

  return NextResponse.json({
    code: coupon.code,
    discount,
  });
}
