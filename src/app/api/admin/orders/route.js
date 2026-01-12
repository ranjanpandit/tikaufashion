import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

/**
 * Admin auth check (Node runtime)
 */
async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * GET: list orders
 * PATCH: update order status
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const orders = await Order.find()
    .sort({ createdAt: -1 });

  return NextResponse.json(orders);
}

export async function PATCH(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { orderId, status } = await req.json();

  await connectMongo();

  await Order.findByIdAndUpdate(orderId, { status });

  return NextResponse.json({ success: true });
}
