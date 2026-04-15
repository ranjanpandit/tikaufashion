import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";

function toObjectFromFormData(formData) {
  const out = {};
  for (const [key, value] of formData.entries()) {
    out[key] = typeof value === "string" ? value : String(value);
  }
  return out;
}

async function parseIncomingPayload(req) {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await req.json();
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await req.formData();
    return toObjectFromFormData(formData);
  }

  const raw = await req.text();
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function mapStatus(statusId) {
  const code = Number(statusId);
  if (code === 1) {
    return {
      paymentStatus: "PAID",
      gatewayStatus: "PAID",
    };
  }

  if (code === 2) {
    return {
      paymentStatus: "PENDING",
      gatewayStatus: "PENDING",
    };
  }

  return {
    paymentStatus: "FAILED",
    gatewayStatus: "FAILED",
  };
}

function normalize(value) {
  return String(value || "").trim();
}

async function findOrderFromPayload(payload) {
  const reportId = normalize(payload.report_id);
  const utr = normalize(payload.utr);
  const clientId = normalize(payload.client_id);

  if (reportId) {
    const byId = await Order.findById(reportId);
    if (byId) return byId;
  }

  if (utr) {
    const byGatewayPayment = await Order.findOne({
      $or: [
        { "paymentGateway.providerPaymentId": utr },
        { "paymentGateway.providerOrderId": utr },
        { razorpayPaymentId: utr },
        { razorpayOrderId: utr },
      ],
    });
    if (byGatewayPayment) return byGatewayPayment;
  }

  if (clientId) {
    const orList = [{ "shippingAddress.phone": clientId }];
    if (mongoose.isValidObjectId(clientId)) {
      orList.push({ customerId: clientId });
    }

    const byCustomerId = await Order.findOne({
      $or: orList,
    }).sort({ createdAt: -1 });
    if (byCustomerId) return byCustomerId;
  }

  return null;
}

export async function POST(req) {
  try {
    await connectMongo();
    const payload = await parseIncomingPayload(req);

    const statusId = normalize(payload.status_id);
    const amount = normalize(payload.amount);
    const utr = normalize(payload.utr);
    const message = normalize(payload.message);

    if (!statusId) {
      return NextResponse.json(
        { success: false, message: "Missing status_id" },
        { status: 400 }
      );
    }

    const order = await findOrderFromPayload(payload);
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message: "Order not found for callback payload",
          payload,
        },
        { status: 404 }
      );
    }

    const mapped = mapStatus(statusId);
    order.paymentStatus = mapped.paymentStatus;
    order.paymentGateway = {
      ...(order.paymentGateway || {}),
      providerPaymentId: utr || order.paymentGateway?.providerPaymentId || null,
      status: mapped.gatewayStatus,
      syncMessage: message || order.paymentGateway?.syncMessage || "",
    };

    if (mapped.paymentStatus === "PAID") {
      order.paymentVerifiedAt = new Date();
      order.razorpayPaymentId = utr || order.razorpayPaymentId;
    }

    await order.save();

    return NextResponse.json({
      success: true,
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      received: {
        status_id: statusId,
        amount,
        utr,
        client_id: normalize(payload.client_id),
        report_id: normalize(payload.report_id),
        message,
      },
    });
  } catch (error) {
    console.error("OPENMONEY CALLBACK WEBHOOK ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Callback webhook failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Callback webhook endpoint is live",
  });
}
