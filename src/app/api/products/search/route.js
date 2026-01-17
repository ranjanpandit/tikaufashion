import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(req) {
  await connectMongo();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q) {
    return NextResponse.json({ products: [] });
  }

  const products = await Product.find({
    name: { $regex: q, $options: "i" },
    isActive: { $ne: false },
  })
    .select("name slug price images image")
    .sort({ createdAt: -1 })
    .limit(10);

  const formatted = products.map((p) => ({
    _id: p._id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    image: p.image || p.images?.[0] || "",
  }));

  return NextResponse.json({ products: formatted });
}
