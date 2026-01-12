import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import { getCustomerFromRequest } from "@/lib/customerAuth";

export async function GET() {
  await connectMongo();

  const customer = await getCustomerFromRequest();
  if (!customer) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const orders = await Order.find({
    customerId: customer.id,
  }).sort({ createdAt: -1 });
console.log('customerId==' ,customer)
  return NextResponse.json(orders);
}
