import { connectMongo } from "@/lib/mongodb";
import Filter from "@/models/Filter";
import { NextResponse } from "next/server";

export async function GET() {
  await connectMongo();
  const filters = await Filter.find({ status: true });
  return NextResponse.json(filters);
}
