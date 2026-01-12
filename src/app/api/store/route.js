export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";

// ✅ FORCE MODEL REGISTRATION
import "@/models/Product";
import "@/models/Store";

import Store from "@/models/Store";

export async function GET() {
  await connectMongo();

  const store = await Store.findOne()
    .populate("featuredProducts", "name images price mrp slug")
    .populate("bestSellingProducts", "name images price mrp slug");

  return NextResponse.json(store);
}
