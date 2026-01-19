import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/adminAuth";
import { requirePermission } from "@/lib/permission";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (!requirePermission(admin, "store")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectMongo();

  const users = await AdminUser.find(
    {},
    { password: 0 } // ✅ hide password
  ).sort({ createdAt: -1 });

  return NextResponse.json(users);
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (!requirePermission(admin, "store")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json(
      { message: "Name, email, password required" },
      { status: 400 }
    );
  }

  await connectMongo();

  const exists = await AdminUser.findOne({ email: body.email.toLowerCase() });
  if (exists) {
    return NextResponse.json(
      { message: "Admin email already exists" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(body.password, 10);

  const user = await AdminUser.create({
    name: body.name,
    email: body.email.toLowerCase(),
    password: hashed,
    role: body.role || "manager",
    permissions: body.permissions || {},
    isActive: body.isActive ?? true,
  });

  return NextResponse.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
}
