import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import StaticPage from "@/models/StaticPage";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectMongo();
  const page = await StaticPage.findById(id);
  return NextResponse.json(page);
}

export async function PUT(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectMongo();
  const body = await req.json();
  const { id } = await params;
  const updated = await StaticPage.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectMongo();
  await StaticPage.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
