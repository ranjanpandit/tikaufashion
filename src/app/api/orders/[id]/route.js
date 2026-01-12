import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getCustomerFromRequest } from "@/lib/customerAuth";

export async function GET(req, { params }) {
  await connectMongo();

  const customer = await getCustomerFromRequest();
  console.log('customer=',customer)
  if (!customer) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const order = await Order.findOne({
    _id: id,
    customerId: customer.id, // 🔐 SECURITY
  });
  console.log({id,customer})

  if (!order) {
    return NextResponse.json(
      { message: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(order);
}
