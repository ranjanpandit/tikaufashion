import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import AdminUser from "@/models/AdminUser";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/adminAuth";
import { requirePermission } from "@/lib/permission";

export async function GET(req, { params }) {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (!requirePermission(admin, "adminUsers")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectMongo();

  const { id } = params;
console.log(id)
  const user = await AdminUser.findById(id).select("-password");

  if (!user) {
    return NextResponse.json({ message: "Admin user not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PUT(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (!requirePermission(admin, "adminUsers")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }


  await connectMongo();

  const body = await req.json();
  const { id } =await params

  // ✅ if password sent, hash it
  if (body.password) {
    body.password = await bcrypt.hash(body.password, 10);
  } else {
    delete body.password;
  }

  const updated = await AdminUser.findByIdAndUpdate(id, { $set: body }, { new: true })
    .select("-password");

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
   const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (!requirePermission(admin, "adminUsers")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const { id } =await params
  await connectMongo();

  await AdminUser.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
