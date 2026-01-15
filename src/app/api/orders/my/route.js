import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getCustomerFromRequest } from "@/lib/customerAuth";

export async function GET(req) {
  await connectMongo();

  const customer = await getCustomerFromRequest();
  if (!customer) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "5", 10);

  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 20); // max 20 per page

  const query = { customerId: customer.id };

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
