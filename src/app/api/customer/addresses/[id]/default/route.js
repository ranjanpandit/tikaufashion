import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { requireCustomer } from "@/lib/requireCustomer";

export async function PATCH(req, { params }) {
  const auth = await requireCustomer();
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const customer = await Customer.findById(auth.id);
  if (!customer) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 });
  }

  const { id } = await params;

  // ✅ safety
  if (!customer.addresses) customer.addresses = [];

  const address = customer.addresses.id(id);
  if (!address) {
    return NextResponse.json({ message: "Address not found" }, { status: 404 });
  }

  customer.addresses.forEach((a) => (a.isDefault = false));
  address.isDefault = true;

  await customer.save();

  return NextResponse.json({ addresses: customer.addresses });
}
