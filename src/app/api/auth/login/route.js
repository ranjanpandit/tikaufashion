import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectMongo } from "@/lib/mongodb";
import Customer from "@/models/Customer";

export async function POST(req) {
  const { email, password } = await req.json();

  await connectMongo();

  const user = await Customer.findOne({ email });
  if (!user) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 }
    );
  }

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // ✅ IMPORTANT FIX (cookies is async)
  const cookieStore = await cookies();

  cookieStore.set("customer_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
}
