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

/* =========================
   GET SINGLE PRODUCT
========================= */
export async function GET(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectMongo();

  const product = await Product.findById(id).populate(
    "categories",
    "name slug"
  );

  if (!product) {
    return NextResponse.json(
      { message: "Product not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(product);
}

/* =========================
   UPDATE PRODUCT
========================= */
export async function PUT(req, { params }) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await req.json();

  await connectMongo();

  /* =========================
     CATEGORY FIX (🔥 IMPORTANT)
  ========================== */
  const categories = Array.isArray(data.categories)
    ? data.categories
        .filter(Boolean)
        .map((cid) => new ObjectId(cid))
    : [];

  /* =========================
     BUILD UPDATE DOC
  ========================== */
  const updateDoc = {
    name: toText(data.name).trim(),
    sku: toText(data?.sku).trim(),
    slug: toText(data.slug).trim(),
    description: toText(data.description),

    mrp: toNumber(data.mrp),
    price: toNumber(data.price),
    stock: toNumber(data.stock),

    status: Boolean(data.status),

    images: Array.isArray(data.images)
      ? data.images.map(toText).filter(Boolean)
      : [],

    // ✅ ObjectId[] stored correctly
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

    updatedAt: new Date(),
  };

  /* =========================
     UPDATE PRODUCT
  ========================== */
  await Product.collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateDoc }
  );

  return NextResponse.json({ success: true });
}
