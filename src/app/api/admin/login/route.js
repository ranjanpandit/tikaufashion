import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json();

  if (email === "admin@tikaufashion.com" && password === "admin123") {
    const token = signToken({ role: "admin", email });

    const res = NextResponse.json({ success: true });

    res.cookies.set("admin_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",   // ✅ FIX
      secure: false,    // ✅ REQUIRED for localhost
    });

    return res;
  }

  return NextResponse.json(
    { message: "Invalid credentials" },
    { status: 401 }
  );
}
