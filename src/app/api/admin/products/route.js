import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Product from "@/models/Product";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

/* =========================
   ADMIN AUTH
========================= */
async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/* =========================
   GET PRODUCTS (ADMIN LIST)
========================= */
export async function GET(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  await connectMongo();

  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const filter = {};

  /* 🔍 Search */
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { slug: { $regex: q, $options: "i" } },
    ];
  }

  /* ✅ Status */
  if (status === "active") filter.status = true;
  if (status === "inactive") filter.status = false;

  /* 🗂️ Category */
  if (category) {
    filter.categories = category;
  }

  const products = await Product.find(filter)
    .populate("categories", "name")
    .sort({ createdAt: -1 })
    .select(
      "name slug images mrp price stock status createdAt"
    );

  return NextResponse.json(products);
}

/* =========================
   PATCH (QUICK STATUS TOGGLE)
========================= */
export async function PATCH(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { productId, status } = await req.json();

  if (!productId || typeof status !== "boolean") {
    return NextResponse.json(
      { message: "Invalid payload" },
      { status: 400 }
    );
  }

  await connectMongo();

  await Product.findByIdAndUpdate(productId, {
    status,
  });

  return NextResponse.json({ success: true });
}
