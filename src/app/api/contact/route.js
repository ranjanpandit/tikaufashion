import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";

export async function POST(req) {
  try {
    await connectMongo();

    const body = await req.json();

    const name = body?.name?.trim();
    const email = body?.email?.trim();
    const phone = body?.phone?.trim() || "";
    const subject = body?.subject?.trim();
    const message = body?.message?.trim();

    // ✅ validations
    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { message: "Valid email is required" },
        { status: 400 }
      );
    }
    if (phone && !/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { message: "Phone must be 10 digits" },
        { status: 400 }
      );
    }
    if (!subject) {
      return NextResponse.json(
        { message: "Subject is required" },
        { status: 400 }
      );
    }
    if (!message) {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    const saved = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
      status: "new",
      source: "website",
    });

    return NextResponse.json({
      success: true,
      id: saved._id,
      message: "Message submitted successfully",
    });
  } catch (err) {
    console.error("CONTACT API ERROR:", err);
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    );
  }
}
