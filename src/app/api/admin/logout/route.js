import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

  // Clear admin cookie
  res.cookies.set("admin_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return res;
}
