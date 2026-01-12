import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Coupon from "@/models/Coupon";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/* =========================
   UPDATE COUPON
========================= */
export async function PUT(req, { params }) {
  const admin = await requireAdmin();
  const {id} = await params
  if (!admin)
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );

  await connectMongo();
  const data = await req.json();

  await Coupon.findByIdAndUpdate(id, {
    code: data.code.toUpperCase(),
    type: data.type,
    value: Number(data.value),
    minOrder: Number(data.minOrder || 0),
    maxDiscount: data.maxDiscount
      ? Number(data.maxDiscount)
      : null,
    expiresAt: new Date(data.expiresAt),
    usageLimit: data.usageLimit
      ? Number(data.usageLimit)
      : null,
    isActive: data.isActive,
  });

  return NextResponse.json({ success: true });
}
