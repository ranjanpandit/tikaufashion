import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(req, { params }) {
  const { slug } = await params; // ✅ FIX

  await connectMongo();

  const product = await Product.findOne({
    slug,
    status: true,
  });

  if (!product) {
    return NextResponse.json(
      { message: "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(product);
}
