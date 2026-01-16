export const runtime = "nodejs";

import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

function safeFolder(input) {
  // allow only simple folder names: products, banners, store, categories etc
  const f = String(input || "").trim().toLowerCase();

  if (!f) return "tikaufashion";

  // ✅ block suspicious values
  if (!/^[a-z0-9-_\/]+$/.test(f)) return "tikaufashion";

  // ✅ force root prefix
  if (f.startsWith("tikaufashion")) return f;

  return `tikaufashion/${f}`;
}

export async function GET(req) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const folderParam = searchParams.get("folder"); // products / banners / store
  const folder = safeFolder(folderParam);

  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    process.env.CLOUDINARY_API_SECRET
  );

  return NextResponse.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  });
}
