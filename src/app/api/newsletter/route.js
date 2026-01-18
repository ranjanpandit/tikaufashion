import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

export async function POST(req) {
  try {
    await connectMongo();

    const body = await req.json();
    const email = (body?.email || "").trim().toLowerCase();
    const source = body?.source || "footer";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // ✅ If already exists -> return success (enterprise UX)
    const existing = await NewsletterSubscriber.findOne({ email });

    if (existing) {
      // if unsubscribed, re-activate
      if (existing.status === "unsubscribed") {
        existing.status = "active";
        existing.source = source;
        await existing.save();
      }

      return NextResponse.json({
        success: true,
        message: "You are already subscribed ✅",
      });
    }

    await NewsletterSubscriber.create({
      email,
      status: "active",
      source,
    });

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully ✅",
    });
  } catch (err) {
    console.error("NEWSLETTER API ERROR:", err);

    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
