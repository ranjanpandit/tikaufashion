import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Category from "@/models/Category";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();
  const categories = await Category.find().sort({ createdAt: -1 });

  return NextResponse.json(categories);
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { name, slug } = await req.json();

  await connectMongo();
  const category = await Category.create({ name, slug });

  return NextResponse.json(category);
}

export async function PATCH(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = await req.json();

  await connectMongo();
  await Category.findByIdAndUpdate(id, { status });

  return NextResponse.json({ success: true });
}
