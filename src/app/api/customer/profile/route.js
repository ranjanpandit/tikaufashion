import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { requireCustomer } from "@/lib/requireCustomer";

export async function GET() {
  const auth = await requireCustomer();
  
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await connectMongo();

  const customer = await Customer.findById(auth.id).select("-password");
  if (!customer) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({
    customer: {
      id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      addresses: customer.addresses || [],
      createdAt: customer.createdAt,
    },
  });
}
