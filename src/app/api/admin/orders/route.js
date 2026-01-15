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

/**
 * GET /api/admin/orders?page=1&limit=10&status=pending&paymentMethod=COD&paymentStatus=pending&search=ranjan
 */
export async function GET(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const status = searchParams.get("status") || "";
  const paymentMethod = searchParams.get("paymentMethod") || "";
  const paymentStatus = searchParams.get("paymentStatus") || "";
  const search = (searchParams.get("search") || "").trim();

  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const query = {};

  if (status) query.status = status;
  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  // Search: orderId, customer name, phone, email
  if (search) {
    query.$or = [
      { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : undefined },
      { "customer.name": { $regex: search, $options: "i" } },
      { "customer.email": { $regex: search, $options: "i" } },
      { "customer.phone": { $regex: search, $options: "i" } },
    ].filter(Boolean);
  }

  const total = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * safeLimit)
    .limit(safeLimit);

  return NextResponse.json({
    orders,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasMore: safePage * safeLimit < total,
    },
  });
}

/**
 * PATCH /api/admin/orders
 * body: { orderId, status }
 */
export async function PATCH(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const { orderId, status } = await req.json();

  if (!orderId) {
    return NextResponse.json({ message: "orderId required" }, { status: 400 });
  }

  const allowed = ["pending", "shipped", "delivered"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  await Order.findByIdAndUpdate(orderId, { status });

  return NextResponse.json({ success: true });
}
