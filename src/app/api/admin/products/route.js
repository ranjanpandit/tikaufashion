import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Product from "@/models/Product";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { ObjectId } from "mongodb";

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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
    .select("name slug images mrp price stock status createdAt");

  return NextResponse.json(products);
}

/* =========================
   HELPERS
========================= */
const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const toText = (v) => {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map(toText).join(", ");
  if (typeof v === "object") return v.code ? String(v.code) : "";
  return String(v);
};

const slugify = (text) =>
  toText(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

/* =========================
   CREATE PRODUCT
========================= */
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectMongo();

  const data = await req.json();

  // basic validation
  const name = toText(data.name).trim();
  if (!name) {
    return NextResponse.json({ message: "Name is required" }, { status: 400 });
  }

  const slug = toText(data.slug).trim() || slugify(name);

  // categories as ObjectId[]
  const categories = Array.isArray(data.categories)
    ? data.categories.filter(Boolean).map((cid) => new ObjectId(cid))
    : [];

  const doc = {
    name,
    slug,
    description: toText(data.description),

    mrp: toNumber(data.mrp),
    price: toNumber(data.price),
    stock: toNumber(data.stock),

    status: Boolean(data.status ?? true),

    images: Array.isArray(data.images)
      ? data.images.map(toText).filter(Boolean)
      : [],

    categories,

    options: Array.isArray(data.options)
      ? data.options.map((opt) => ({
          name: toText(opt.name).trim(),
          values: Array.isArray(opt.values)
            ? opt.values.map(toText).filter(Boolean)
            : [],
        }))
      : [],

    variants: Array.isArray(data.variants)
      ? data.variants.map((v) => ({
          options:
            typeof v.options === "object" && v.options !== null
              ? Object.fromEntries(
                  Object.entries(v.options).map(([k, val]) => [
                    toText(k),
                    toText(val),
                  ])
                )
              : {},
          mrp: toNumber(v.mrp),
          price: toNumber(v.price),
          stock: toNumber(v.stock),
          sku: toText(v.sku),
          image: toText(v.image),
        }))
      : [],

    filters:
      typeof data.filters === "object" && data.filters !== null
        ? data.filters
        : {},

    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // optional: ensure slug unique
  const existing = await Product.findOne({ slug });
  if (existing) {
    return NextResponse.json(
      { message: "Slug already exists, please use another slug" },
      { status: 400 }
    );
  }

  const product = await Product.create(doc);

  return NextResponse.json({ success: true, productId: product._id });
}
