export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Store from "@/models/Store";
import "@/models/Product"; // ✅ REQUIRED for populate
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminAuth";
import { requirePermission } from "@/lib/permission";

/* =========================
   GET STORE (ADMIN)
========================= */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (!requirePermission(admin, "store")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await connectMongo();

  let store = await Store.findOne()
    .populate("featuredProducts", "name images price mrp slug")
    .populate("bestSellingProducts", "name images price mrp slug");

  if (!store) {
    store = await Store.create({
      menu: [],
      homepageSlices: [],
      banners: [],
      featuredProducts: [],
      bestSellingProducts: [],
    });
  }

  return NextResponse.json(store);
}

/* =========================
   UPDATE STORE (ADMIN)
========================= */
export async function PUT(req) {
  const admin = await requireAdmin();
  if (!admin)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  if (!requirePermission(admin, "store")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const data = await req.json();
  await connectMongo();

  /* ✅ NORMALIZE PRODUCT IDS */
  const normalizeIds = (arr = []) => [
    ...new Set(
      arr
        .map((item) =>
          typeof item === "object" && item !== null ? item._id : item
        )
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];

  const featuredProducts = normalizeIds(data.featuredProducts);
  const bestSellingProducts = normalizeIds(data.bestSellingProducts);

  /* ✅ NORMALIZE MENU (SAFE) */
  const menu = (data.menu || []).map((item, index) => ({
    label: item.label || "",
    slug: item.slug || "",
    type: item.type || "link", // link | mega
    active: item.active !== false,
    order: index,
    columns:
      item.type === "mega"
        ? (item.columns || []).map((col) => ({
            title: col.title || "",
            links: (col.links || []).map((l) => ({
              label: l.label || "",
              href: l.href || "",
            })),
          }))
        : [],
  }));

  const store = await Store.findOneAndUpdate(
    {},
    {
      $set: {
        name: data.name,
        logo: data.logo,
        banners: data.banners || [],
        homepageSlices: data.homepageSlices || [],
        featuredProducts,
        bestSellingProducts,
        menu, // ✅ MEGA MENU SAVED
        theme: {
          preset: data.theme?.preset || "default",
          primaryColor: data.theme?.primaryColor || "#000000",
          secondaryColor: data.theme?.secondaryColor || "#666666",
          buttonRadius: data.theme?.buttonRadius || "0.375rem",
          fontFamily: data.theme?.fontFamily || "Inter, system-ui, sans-serif",
        },
      },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json(store);
}
