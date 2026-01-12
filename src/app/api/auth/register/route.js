import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongo } from "@/lib/mongodb";
import Customer from "@/models/Customer";

export async function POST(req) {
  const { name, email, password } = await req.json();

  await connectMongo();

  const exists = await Customer.findOne({ email });
  if (exists) {
    return NextResponse.json(
      { message: "Email already registered" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  await Customer.create({
    name,
    email,
    password: hashed,
  });

  return NextResponse.json({ success: true });
}
