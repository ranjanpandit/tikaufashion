import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";

export async function GET(req) {
  await connectMongo();

  const { searchParams } = new URL(req.url);

  const categorySlug = searchParams.get("category");
  const sort = searchParams.get("sort");

  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 12);
  const skip = (page - 1) * limit;

  let filter = { status: true };
  let category = null;

  /* =========================
     CATEGORY FILTER
  ========================== */
  if (categorySlug) {
    category = await Category.findOne({ slug: categorySlug });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    filter.categories = { $in: [category._id] };
  }

  /* =========================
     DYNAMIC FILTERS (ANY MATCH - FIXED)
  ========================== */
  const orFilters = [];

  for (const [key, value] of searchParams.entries()) {
    // ignore non-filter params
    if (
      ["category", "sort", "page", "limit"].includes(key) ||
      !value
    ) {
      continue;
    }

    const values = value.split(",").filter(Boolean);

    // safety check
    if (values.length === 0) continue;

    orFilters.push({
      [`filters.${key}`]: { $in: values },
    });
  }

  if (orFilters.length > 0) {
    filter.$or = orFilters;
  }

  /* =========================
     SORTING
  ========================== */
  let sortQuery = { createdAt: -1 };
  if (sort === "price_asc") sortQuery = { price: 1 };
  if (sort === "price_desc") sortQuery = { price: -1 };

  const total = await Product.countDocuments(filter);

  console.log("FINAL FILTER:", JSON.stringify(filter, null, 2));

  const products = await Product.find(filter)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit)
    .select("name slug images price mrp filters");

  return NextResponse.json({
    category,
    products,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
