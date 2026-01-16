import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { requireCustomer } from "@/lib/requireCustomer";

export async function PUT(req, { params }) {
  const auth = await requireCustomer();
  if (!auth) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const customer = await Customer.findById(auth.id);
  if (!customer) {
    return NextResponse.json({ message: "Customer not found" }, { status: 404 });
  }

  const { id } = params;
  const body = await req.json();

  if (!customer.addresses) customer.addresses = [];

  const address = customer.addresses.id(id);
  if (!address) {
    return NextResponse.json({ message: "Address not found" }, { status: 404 });
  }

  address.fullName = body.fullName ?? address.fullName;
  address.phone = body.phone ?? address.phone;
  address.pincode = body.pincode ?? address.pincode;
  address.address1 = body.address1 ?? address.address1;
  address.address2 = body.address2 ?? address.address2;
  address.city = body.city ?? address.city;
  address.state = body.state ?? address.state;
  address.landmark = body.landmark ?? address.landmark;
  address.type = body.type ?? address.type;

  // ✅ if making default
  if (body.isDefault === true) {
    customer.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  }

  await customer.save();

  return NextResponse.json({ addresses: customer.addresses });
}

export async function DELETE(req, { params }) {
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

  if (!customer.addresses) customer.addresses = [];

  const address = customer.addresses.id(id);
  if (!address) {
    return NextResponse.json({ message: "Address not found" }, { status: 404 });
  }

  const wasDefault = address.isDefault === true;

  // ✅ delete address
  address.deleteOne();

  // ✅ If default deleted → make first address default
  if (wasDefault && customer.addresses.length > 0) {
    customer.addresses.forEach((a) => (a.isDefault = false));
    customer.addresses[0].isDefault = true;
  }

  await customer.save();

  return NextResponse.json({ addresses: customer.addresses });
}
