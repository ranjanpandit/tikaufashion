import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";

export async function GET(req, { params }) {
  const { slug } = await params;

  await connectMongo();

  const category = await Category.findOne({
    slug,
    status: true,
  });

  if (!category) {
    return NextResponse.json(
      { message: "Category not found" },
      { status: 404 }
    );
  }

  const products = await Product.find({
    status: true,
    categories: category._id,
  }).sort({ createdAt: -1 });

  return NextResponse.json({
    category,
    products,
  });
}
