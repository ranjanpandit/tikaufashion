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

  const customer = await Customer.findById(auth.id);
  if (!customer) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ addresses: customer.addresses || [] });
}

export async function POST(req) {
  const auth = await requireCustomer();
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const customer = await Customer.findById(auth.id);
  if (!customer) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 });
  }

  // ✅ ensure addresses array exists
  if (!customer.addresses) customer.addresses = [];

  const body = await req.json();

  // ✅ If first address OR user selected default
  const isFirstAddress = customer.addresses.length === 0;
  const makeDefault = body.isDefault === true || isFirstAddress;

  if (makeDefault) {
    customer.addresses.forEach((a) => (a.isDefault = false));
  }

  customer.addresses.push({
    fullName: body.fullName,
    phone: body.phone,
    pincode: body.pincode,
    address1: body.address1,
    address2: body.address2 || "",
    city: body.city,
    state: body.state,
    landmark: body.landmark || "",
    type: body.type || "home",
    isDefault: makeDefault,
  });

  await customer.save();

  return NextResponse.json({ addresses: customer.addresses });
}
