import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import Product from "@/models/Product";
import { getCustomerFromRequest } from "@/lib/customerAuth";
import { buildGatewayOrderRecord } from "@/lib/mini-payment-gateway";

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
  if (maxDiscount) {
    discount = Math.min(discount, maxDiscount);
  }

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

    if (!data?.items?.length) {
      return NextResponse.json(
        { success: false, message: "Cart items missing" },
        { status: 400 }
      );
    }

    const paymentMethod = String(data.paymentMethod || "COD").toUpperCase();

    if (!["COD", "PREPAID"].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 }
      );
    }

    const shipping = data?.shippingAddress || data?.address || {};

    if (
      !shipping?.line1 ||
      !shipping?.city ||
      !shipping?.state ||
      !shipping?.pincode
    ) {
      return NextResponse.json(
        { success: false, message: "Delivery address missing" },
        { status: 400 }
      );
    }

    let items = [];
    let serverSubtotal = 0;

    for (const i of data.items) {
      const product = await Product.findById(i.productId).select(
        "name slug price images variants"
      );

      if (!product) {
        return NextResponse.json(
          { success: false, message: "Some products not found" },
          { status: 400 }
        );
      }

      const qty = Number(i.qty || 1);
      if (qty <= 0) {
        return NextResponse.json(
          { success: false, message: "Invalid quantity" },
          { status: 400 }
        );
      }

      const selectedOptions = i.selectedOptions || {};
      const variant = findMatchingVariant(product, selectedOptions);

      if (Object.keys(selectedOptions).length > 0 && !variant) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid variant selected for: ${product.name}`,
            selectedOptions,
          },
          { status: 400 }
        );
      }

      const finalPrice = Number(variant?.price ?? product.price);
      const finalImage = variant?.image || i.image || product?.images?.[0] || "";
      const lineTotal = finalPrice * qty;

      serverSubtotal += lineTotal;

      items.push({
        cartId: i.cartId,
        productId: i.productId,
        slug: product.slug,
        name: product.name,
        price: finalPrice,
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
      return NextResponse.json(
        { success: false, message: "Invalid payable total" },
        { status: 400 }
      );
    }

    let paymentStatus = "PENDING";
    const providerOrderId = data.providerOrderId || data.razorpayOrderId || null;
    const providerPaymentId =
      data.providerPaymentId || data.razorpayPaymentId || null;
    const providerSignature =
      data.providerSignature || data.razorpaySignature || null;

    if (paymentMethod === "PREPAID") {
      if (!providerOrderId || !providerPaymentId) {
        return NextResponse.json(
          { success: false, message: "Payment not verified" },
          { status: 400 }
        );
      }

      paymentStatus = "PAID";
    }

    const order = await Order.create({
      customerId: customer?.id || null,

      customer: {
        name: data.customer?.name || shipping.fullName || "",
        email: data.customer?.email || "",
        phone: data.customer?.phone || shipping.phone || "",
      },

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
      paymentStatus,
      paymentGateway: buildGatewayOrderRecord({
        providerOrderId,
        providerPaymentId,
        signature: providerSignature,
        status: paymentStatus,
        verifiedAt: paymentStatus === "PAID" ? new Date() : null,
      }),
      razorpayOrderId: data.razorpayOrderId || providerOrderId,
      razorpayPaymentId: data.razorpayPaymentId || providerPaymentId,
      razorpaySignature: data.razorpaySignature || providerSignature,
      status: "PLACED",
    });

    if (couponDoc) {
      await Coupon.updateOne({ _id: couponDoc._id }, { $inc: { usedCount: 1 } });
    }

    return NextResponse.json({
      success: true,
      orderId: order._id,
      bill: {
        subtotal: serverSubtotal,
        discount: couponDiscount,
        total: serverTotal,
      },
    });
  } catch (err) {
    console.error("ORDER CREATE ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Failed to place order", error: err?.message },
      { status: 500 }
    );
  }
}
