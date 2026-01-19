import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json();

  await connectMongo();

  const admin = await AdminUser.findOne({ email: email.toLowerCase() });

  if (!admin) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  if (!admin.isActive) {
    return NextResponse.json({ message: "Admin account disabled" }, { status: 403 });
  }

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  // ✅ update last login
  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken({
    id: admin._id,
    email: admin.email,
    role: admin.role,
    permissions: admin.permissions,
    name: admin.name,
    type: "admin",
  });

  const res = NextResponse.json({ success: true });

  res.cookies.set("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
