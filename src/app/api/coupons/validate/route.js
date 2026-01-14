import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export async function POST(req) {
  await connectMongo();

  const { code, subtotal } = await req.json();

  /* =========================
     BASIC VALIDATION
  ========================== */
  if (!code) {
    return NextResponse.json(
      { message: "Coupon code required" },
      { status: 400 }
    );
  }

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    return NextResponse.json(
      { message: "Invalid coupon" },
      { status: 400 }
    );
  }

  /* =========================
     EXPIRY CHECK
  ========================== */
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return NextResponse.json(
      { message: "Coupon expired" },
      { status: 400 }
    );
  }

  /* =========================
     MIN ORDER CHECK
  ========================== */
  if (coupon.minOrder && subtotal < coupon.minOrder) {
    return NextResponse.json(
      {
        message: `Minimum order ₹${coupon.minOrder}`,
      },
      { status: 400 }
    );
  }

  /* =========================
     USAGE LIMIT CHECK
  ========================== */
  if (
    coupon.usageLimit &&
    coupon.usedCount >= coupon.usageLimit
  ) {
    return NextResponse.json(
      { message: "Coupon usage limit reached" },
      { status: 400 }
    );
  }

  /* =========================
     SUCCESS RESPONSE
     (RETURN RULES, NOT DISCOUNT)
  ========================== */
  return NextResponse.json({
    code: coupon.code,
    type:
      coupon.type === "percentage"
        ? "PERCENT"
        : "FLAT",
    value: coupon.value,
    maxDiscount: coupon.maxDiscount || null,
    minOrder: coupon.minOrder || null,
  });
}
