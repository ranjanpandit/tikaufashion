import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getCustomerFromRequest } from "@/lib/customerAuth";

export async function GET(req, { params }) {
  await connectMongo();

  const { id } = await params;
  const customer = await getCustomerFromRequest();

  // 1️⃣ Fetch order by ID only
  const order = await Order.findById(id);

  if (!order) {
    return NextResponse.json(
      { message: "Order not found" },
      { status: 404 }
    );
  }

  /**
   * 2️⃣ SECURITY CHECK
   *
   * - If order has customerId → must match logged-in user
   * - If order has NO customerId → allow (guest order)
   */
  if (order.customerId) {
    // order belongs to a registered user
    if (!customer || order.customerId.toString() !== customer.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  // 3️⃣ Guest order OR valid logged-in user
  return NextResponse.json(order);
}
