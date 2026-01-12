import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export async function POST(req) {
  await connectMongo();
  const data = await req.json();

  const coupon = await Coupon.create({
    code: data.code,
    type: data.type,
    value: data.value,
    minOrder: data.minOrder,
    maxDiscount: data.maxDiscount,
    expiresAt: data.expiresAt,
    usageLimit: data.usageLimit,
  });

  return NextResponse.json(coupon);
}

export async function GET() {
  await connectMongo();
  const coupons = await Coupon.find().sort({
    createdAt: -1,
  });
  return NextResponse.json(coupons);
}
