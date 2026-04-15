import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import Product from "@/models/Product";
import { getCustomerFromRequest } from "@/lib/customerAuth";
import {
  buildGatewayOrderRecord,
  createPlatformOrder,
  createGatewayOrder,
  getPaymentGatewayMeta,
  sendPayoutWebhook,
} from "@/lib/mini-payment-gateway";
import { hasMiniPaymentPlatformConfig } from "@/lib/mini-payment-gateway/config";

const PAYMENT_DEBUG_LOGS = String(process.env.PAYMENT_DEBUG_LOGS || "").toLowerCase() === "true";

function calculateDiscount(subtotal, coupon) {
  if (!coupon) return 0;

  let discount = 0;

  const type = String(coupon.type || coupon.couponType || "").toUpperCase();
  const value = Number(coupon.value || 0);

  if (type === "PERCENT" || type === "PERCENTAGE") {
    discount = (subtotal * value) / 100;
  }

  if (type === "FLAT") {
    discount = value;
  }

  const maxDiscount = Number(coupon.maxDiscount || 0);
  if (maxDiscount) discount = Math.min(discount, maxDiscount);

  discount = Math.min(discount, subtotal);
  return Math.round(discount);
}

function normalizeOptions(obj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    out[String(k).trim().toLowerCase()] = String(v).trim().toLowerCase();
  }
  return out;
}

function isSameOptions(a = {}, b = {}) {
  const A = normalizeOptions(a);
  const B = normalizeOptions(b);

  const aKeys = Object.keys(A);
  const bKeys = Object.keys(B);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (A[key] !== B[key]) return false;
  }
  return true;
}

function findMatchingVariant(product, selectedOptions) {
  if (!selectedOptions || Object.keys(selectedOptions).length === 0) return null;

  const variants = product?.variants || [];
  if (!variants.length) return null;

  return variants.find((v) => isSameOptions(v.options || {}, selectedOptions));
}

export async function POST(req) {
  try {
    await connectMongo();

    const data = await req.json();
    const customer = await getCustomerFromRequest();
    const paymentMethod = "PREPAID";

    if (!data?.items?.length) {
      return NextResponse.json({ message: "Cart items missing" }, { status: 400 });
    }

    const shipping = data?.shippingAddress || data?.address || {};
    if (!shipping?.line1 || !shipping?.city || !shipping?.state || !shipping?.pincode) {
      return NextResponse.json({ message: "Delivery address missing" }, { status: 400 });
    }

    let items = [];
    let serverSubtotal = 0;

    for (const i of data.items) {
      const product = await Product.findById(i.productId).select(
        "name slug price images variants"
      );

      if (!product) {
        return NextResponse.json({ message: "Some products not found" }, { status: 400 });
      }

      const qty = Number(i.qty || 1);
      if (qty <= 0) {
        return NextResponse.json({ message: "Invalid quantity" }, { status: 400 });
      }

      const selectedOptions = i.selectedOptions || {};
      const variant = findMatchingVariant(product, selectedOptions);

      if (Object.keys(selectedOptions).length > 0 && !variant) {
        return NextResponse.json(
          {
            message: `Invalid variant selected for product: ${product.name}`,
            selectedOptions,
          },
          { status: 400 }
        );
      }

      const finalUnitPrice = Number(variant?.price ?? product.price);
      const finalImage = variant?.image || i.image || product?.images?.[0] || "";

      const lineTotal = finalUnitPrice * qty;
      serverSubtotal += lineTotal;

      items.push({
        cartId: i.cartId,
        productId: i.productId,
        slug: product.slug,
        name: product.name,
        price: finalUnitPrice,
        qty,
        image: finalImage,
        selectedOptions,
      });
    }

    let couponDoc = null;
    let couponDiscount = 0;

    const couponCode = String(data?.coupon?.code || "").trim().toUpperCase();
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode });

      if (couponDoc) {
        couponDiscount = calculateDiscount(serverSubtotal, {
          type: couponDoc.type || couponDoc.couponType,
          value: couponDoc.value,
          maxDiscount: couponDoc.maxDiscount,
        });
      }
    }

    const serverTotal = Math.max(serverSubtotal - couponDiscount, 0);
    if (serverTotal <= 0) {
      return NextResponse.json({ message: "Invalid payable total" }, { status: 400 });
    }

    const receipt = `rcpt_${Date.now()}`;
    const clientOrderId = `TIKAU-${Date.now()}`;
    const customerPayload = {
      name: data.customer?.name || shipping.fullName || "",
      email: data.customer?.email || "",
      phone: data.customer?.phone || shipping.phone || "",
    };

    if (PAYMENT_DEBUG_LOGS) {
      console.log("[PAYMENT DEBUG] /api/payment/init payload", {
        itemsCount: data.items?.length || 0,
        subtotalClient: data.subtotal,
        discountClient: data.discount,
        coupon: data?.coupon?.code || null,
        customer: customerPayload,
        shippingAddress: {
          city: shipping.city,
          state: shipping.state,
          pincode: shipping.pincode,
          type: shipping.type || "home",
        },
      });
    }

    const gatewayMeta = getPaymentGatewayMeta();
    let platformOrder = null;

    if (hasMiniPaymentPlatformConfig() && gatewayMeta.provider === "razorpay") {
      try {
        platformOrder = await createPlatformOrder({
          amount: serverTotal,
          currency: "INR",
          clientOrderId,
          customer: customerPayload,
          gatewayCode: String(gatewayMeta.provider || "").toUpperCase(),
          description: `Tikau Fashion checkout for ${items.length} item(s)`,
          metadata: {
            website: "tikaufashion",
            receipt,
            customerEmail: customerPayload.email || "",
          },
        });
      } catch (platformError) {
        console.error("PLATFORM ORDER CREATE ERROR:", platformError);
      }
    }
    const providerOrder = await createGatewayOrder({
      amount: Math.round(serverTotal * 100),
      currency: "INR",
      receipt,
      customer: customerPayload,
    });
    const providerOrderId = providerOrder?.id || providerOrder?.orderId || providerOrder?.refId;

    if (!providerOrderId) {
      throw new Error("Gateway order id is missing from provider response");
    }

    const dbOrder = await Order.create({
      customerId: customer?.id || null,

      customer: customerPayload,

      shippingAddress: {
        fullName: shipping.fullName || data.customer?.name || "",
        phone: shipping.phone || data.customer?.phone || "",
        pincode: shipping.pincode || "",
        line1: shipping.line1,
        line2: shipping.line2 || "",
        city: shipping.city,
        state: shipping.state,
        landmark: shipping.landmark || "",
        type: shipping.type || "home",
        addressId: shipping.addressId || null,
      },

      items,
      subtotal: serverSubtotal,
      discount: couponDiscount,

      coupon: couponDoc
        ? {
            code: couponDoc.code,
            couponType: couponDoc.type || couponDoc.couponType || "",
            value: couponDoc.value || 0,
            discountAmount: couponDiscount,
          }
        : undefined,

      total: serverTotal,
      paymentMethod,
      paymentStatus: "PENDING",
      paymentGateway: buildGatewayOrderRecord({
        platformOrderId: platformOrder?.order?.platformOrderId || null,
        platformGatewayCode:
          platformOrder?.gateway?.code || String(gatewayMeta.provider || "").toUpperCase(),
        providerOrderId,
        receipt,
        status: "PENDING",
        syncStatus: "PENDING",
        syncMessage: platformOrder
          ? "Awaiting payment confirmation sync with platform."
          : "Platform sync skipped for this provider.",
      }),
      razorpayOrderId: providerOrderId,
      razorpayPaymentId: null,
      receipt,
      status: "PLACED",
    });

    try {
      await sendPayoutWebhook({
        statusId: 2,
        amount: Number(serverTotal || 0),
        utr: providerOrderId || receipt,
        clientId: String(customer?.id || customerPayload.phone || ""),
        message: "Payment pending",
      });
    } catch (payoutError) {
      console.error("PAYOUT WEBHOOK PENDING SYNC ERROR:", payoutError);
    }

    return NextResponse.json({
      success: true,
      orderId: dbOrder._id,
      bill: {
        subtotal: serverSubtotal,
        discount: couponDiscount,
        total: serverTotal,
      },
      razorpay:
        gatewayMeta.provider === "razorpay"
          ? {
              id: providerOrderId,
              amount: providerOrder.amount,
              currency: providerOrder.currency,
            }
          : null,
      openmoney:
        gatewayMeta.provider === "openmoney"
          ? {
              refId: providerOrder.refId || providerOrderId,
              amount: providerOrder.amount,
              currency: providerOrder.currency || "INR",
              paymentUrl: providerOrder.paymentUrl || "",
              qrString: providerOrder.qrString || "",
              txnId: providerOrder.txnId || null,
              txnDate: providerOrder.txnDate || null,
              apiStatus: providerOrder.apiStatus || null,
            }
          : null,
      paymentGateway: {
        ...gatewayMeta,
        platformOrderId: platformOrder?.order?.platformOrderId || null,
        orderId: providerOrderId,
        amount: providerOrder.amount,
        currency: providerOrder.currency || "INR",
        paymentUrl: providerOrder.paymentUrl || "",
        qrString: providerOrder.qrString || "",
        txnId: providerOrder.txnId || null,
        txnDate: providerOrder.txnDate || null,
        refId: providerOrder.refId || providerOrderId,
      },
      customer: {
        name: dbOrder.customer.name,
        email: dbOrder.customer.email,
        phone: dbOrder.customer.phone,
      },
    });
  } catch (err) {
    console.error("PAYMENT INIT ERROR:", err);
    const exactMessage =
      err?.message || err?.error || "Failed to init payment";

    return NextResponse.json(
      { message: exactMessage, error: exactMessage },
      { status: 500 }
    );
  }
}
