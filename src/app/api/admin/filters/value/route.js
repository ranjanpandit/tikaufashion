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

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { filterId, label, value } = await req.json();

  await connectMongo();

  await Filter.findByIdAndUpdate(filterId, {
    $push: {
      values: { label, value },
    },
  });

  return NextResponse.json({ success: true });
}
