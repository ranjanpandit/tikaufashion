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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectMongo();
  const pages = await StaticPage.find().sort({ sortOrder: 1, createdAt: -1 });
  return NextResponse.json(pages);
}

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  await connectMongo();
  const body = await req.json();

  if (!body.title) {
    return NextResponse.json({ message: "Title is required" }, { status: 400 });
  }

  const slug = (body.slug || body.title)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const exists = await StaticPage.findOne({ slug });
  if (exists) {
    return NextResponse.json({ message: "Slug already exists" }, { status: 400 });
  }

  const page = await StaticPage.create({
    title: body.title,
    slug,
    content: body.content || "",
    status: body.status || "draft",
    seo: body.seo || {},
    showInHeader: !!body.showInHeader,
    showInFooter: body.showInFooter ?? true,
    sortOrder: body.sortOrder || 0,
  });

  return NextResponse.json(page);
}
