import { NextResponse } from "next/server";
import {
  createGatewayOrder,
  getPaymentGatewayMeta,
} from "@/lib/mini-payment-gateway";

export async function POST(req) {
  try {
    const { amount, customer } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ message: "Invalid amount" }, { status: 400 });
    }

    const order = await createGatewayOrder({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      customer,
    });

    return NextResponse.json({
      ...order,
      paymentGateway: getPaymentGatewayMeta(),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { message: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
