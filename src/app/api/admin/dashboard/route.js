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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const totalOrders = await Order.countDocuments();
  const totalRevenueAgg = await Order.aggregate([
    { $match: { paymentStatus: "paid" } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = await Order.countDocuments({
    createdAt: { $gte: today },
  });

  const statusCounts = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const recentOrders = await Order.find()
    .sort({ createdAt: -1 })
    .limit(5);

  return NextResponse.json({
    totalOrders,
    totalRevenue: totalRevenueAgg[0]?.total || 0,
    todayOrders,
    statusCounts,
    recentOrders,
  });
}
