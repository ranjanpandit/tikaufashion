import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const body = await req.json();

    const secret = body?.secret;
    const name = body?.name;
    const email = body?.email;
    const password = body?.password;

    // ✅ verify secret
    if (!process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json(
        { message: "ADMIN_SETUP_SECRET not configured" },
        { status: 500 }
      );
    }

    if (!secret || secret !== process.env.ADMIN_SETUP_SECRET) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password required" },
        { status: 400 }
      );
    }

    await connectMongo();

    // ✅ Only allow if no admin exists
    const existingCount = await AdminUser.countDocuments();
    if (existingCount > 0) {
      return NextResponse.json(
        { message: "Super admin already created. Setup is disabled." },
        { status: 403 }
      );
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = await AdminUser.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: "super_admin",
      permissions: {
        orders: true,
        products: true,
        store: true,
        coupons: true,
        pages: true,
        adminUsers: true,
      },
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: "✅ Super Admin created successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Setup failed", error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
