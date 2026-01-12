import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Customer from "@/models/Customer";
import { connectMongo } from "@/lib/mongodb";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("customer_token")?.value;

    if (!token) return NextResponse.json(null);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    await connectMongo();

    const customer = await Customer.findById(
      decoded.id
    ).select("name email");

    if (!customer) return NextResponse.json(null);

    return NextResponse.json({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
    });
  } catch (err) {
    return NextResponse.json(null);
  }
}
