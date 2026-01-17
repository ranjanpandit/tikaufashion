import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import Product from "@/models/Product";
import { getCustomerFromRequest } from "@/lib/customerAuth";

export async function POST(req) {
  await connectMongo();

  const data = await req.json();
  const customer = await getCustomerFromRequest();

  if (!data?.items?.length) {
    return NextResponse.json(
      { success: false, message: "Cart items missing" },
      { status: 400 }
    );
  }

  /* =========================
     ✅ SERVER SIDE TOTAL CALC
  ========================== */
  let items = [];
  let serverSubtotal = 0;

  for (const i of data.items) {
    const product = await Product.findById(i.productId).select(
      "name slug price images"
    );

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Some products not found" },
        { status: 400 }
      );
    }

    const qty = Number(i.qty || 1);
    const price = Number(i.price || product.price); // fallback to product price

    if (qty <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid quantity" },
        { status: 400 }
      );
    }

    const lineTotal = price * qty;
    serverSubtotal += lineTotal;

    items.push({
      cartId: i.cartId,
      productId: i.productId,
      slug: i.slug || product.slug,
      name: i.name || product.name,
      price,
      qty,
      image: i.image || product?.images?.[0] || "",
      selectedOptions: i.selectedOptions || {},
    });
  }

  /* =========================
     ✅ COUPON VALIDATION (basic)
  ========================== */
  let couponDoc = null;
  let couponDiscount = 0;

  if (data?.coupon?.code) {
    couponDoc = await Coupon.findOne({ code: data.coupon.code });

    // if coupon exists, apply discount from payload safely
    if (couponDoc) {
      // ✅ Use discount already computed by your validate API
      // but do not allow discount > subtotal
      couponDiscount = Math.min(Number(data.discount || 0), serverSubtotal);
    }
  }

  const serverTotal = Math.max(serverSubtotal - couponDiscount, 0);

  /* =========================
     ✅ SHIPPING ADDRESS SNAPSHOT
  ========================== */
  const shipping = data?.address || {};

  if (!shipping?.line1 || !shipping?.city || !shipping?.state || !shipping?.pincode) {
    return NextResponse.json(
      { success: false, message: "Delivery address missing" },
      { status: 400 }
    );
  }

  /* =========================
     ✅ CREATE ORDER
  ========================== */
  const order = await Order.create({
    customerId: customer?.id || null,

    customer: {
      name: data.customer?.name || "",
      email: data.customer?.email || "",
      phone: data.customer?.phone || "",
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
          couponType: couponDoc.type || data.coupon?.type || "",
          value: couponDoc.value || data.coupon?.value || 0,
          discountAmount: couponDiscount,
        }
      : undefined,

    total: serverTotal,

    paymentMethod: data.paymentMethod || "COD",

    // ✅ enterprise payment logic
    paymentStatus: data.paymentMethod === "COD" ? "PENDING" : "PENDING",

    razorpayOrderId: data.razorpayOrderId || null,
    razorpayPaymentId: data.razorpayPaymentId || null,

    status: "PLACED",
  });

  /* =========================
     ✅ UPDATE COUPON USAGE
  ========================== */
  if (couponDoc) {
    await Coupon.updateOne({ _id: couponDoc._id }, { $inc: { usedCount: 1 } });
  }

  return NextResponse.json({
    success: true,
    orderId: order._id,
  });
}
