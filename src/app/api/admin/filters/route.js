import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Filter from "@/models/Filter";
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
  if (!admin) return NextResponse.json([], { status: 401 });

  await connectMongo();
  return NextResponse.json(await Filter.find());
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({}, { status: 401 });

  const data = await req.json();
  await connectMongo();

  const filter = await Filter.create(data);
  return NextResponse.json(filter);
}

export async function PATCH(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({}, { status: 401 });

  const { id, status } = await req.json();
  await connectMongo();

  await Filter.findByIdAndUpdate(id, { status });
  return NextResponse.json({ success: true });
}
