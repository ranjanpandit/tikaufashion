import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import StaticPage from "@/models/StaticPage";

export async function GET() {
  await connectMongo();

  const pages = await StaticPage.find(
    { status: "published", showInFooter: true },
    { title: 1, slug: 1, sortOrder: 1 }
  )
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(20);

  return NextResponse.json(pages);
}
