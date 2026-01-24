import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import Product from "@/models/Product";
import { getCustomerFromRequest } from "@/lib/customerAuth";

/* =========================
   ✅ EXACT CARTSLICE LOGIC
========================= */
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

/* =========================
   ✅ VARIANT MATCH (SECURE)
========================= */
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

    // ✅ Validate shipping address
    const shipping = data?.shippingAddress || data?.address || {};
    if (!shipping?.line1 || !shipping?.city || !shipping?.state || !shipping?.pincode) {
      return NextResponse.json({ message: "Delivery address missing" }, { status: 400 });
    }

    /* =========================
       ✅ Server-side pricing (variant based)
    ========================== */
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

      // ✅ Pick variant price if options exist
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
      const finalImage =
        variant?.image || i.image || product?.images?.[0] || "";

      const lineTotal = finalUnitPrice * qty;
      serverSubtotal += lineTotal;

      items.push({
        cartId: i.cartId,
        productId: i.productId,
        slug: product.slug,
        name: product.name,
        price: finalUnitPrice, // ✅ snapshot variant price
        qty,
        image: finalImage,
        selectedOptions,
      });
    }

    /* =========================
       ✅ Coupon validation (DB)
    ========================== */
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
    // console.log({serverSubtotal,couponDiscount,serverTotal})
    if (serverTotal <= 0) {
      return NextResponse.json({ message: "Invalid payable total" }, { status: 400 });
    }

    /* =========================
       ✅ Create Razorpay Order
    ========================== */
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ message: "Razorpay keys missing" }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const receipt = `rcpt_${Date.now()}`;

    const rpOrder = await razorpay.orders.create({
      amount: Math.round(serverTotal * 100), // INR -> paise
      currency: "INR",
      receipt,
    });

    /* =========================
       ✅ Create DB Order (PENDING)
    ========================== */
    const dbOrder = await Order.create({
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
      paymentStatus: "PENDING",

      razorpayOrderId: rpOrder.id,
      razorpayPaymentId: null,

      status: "PLACED",
    });

    return NextResponse.json({
      success: true,
      orderId: dbOrder._id,

      bill: {
        subtotal: serverSubtotal,
        discount: couponDiscount,
        total: serverTotal,
      },

      razorpay: {
        id: rpOrder.id,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
      },

      customer: {
        name: dbOrder.customer.name,
        email: dbOrder.customer.email,
        phone: dbOrder.customer.phone,
      },
    });
  } catch (err) {
    console.error("PAYMENT INIT ERROR:", err);
    return NextResponse.json(
      { message: "Failed to init payment", error: err?.message },
      { status: 500 }
    );
  }
}
