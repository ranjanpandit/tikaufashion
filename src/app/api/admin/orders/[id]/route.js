import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const { id } = await params;


  const order = await Order.findById(id);
  if (!order) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}
