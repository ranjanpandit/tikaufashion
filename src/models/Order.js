import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: String,
    couponType: String, // 🔥 renamed from `type`
    value: Number,
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },

    customer: {
      name: String,
      email: String,
      phone: String,
    },

    address: {
      line1: String,
      city: String,
      state: String,
      pincode: String,
    },

    items: [
      {
        cartId: String,
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        slug: String,
        name: String,
        price: Number,
        qty: Number,
        image: String,
        selectedOptions: {
          type: mongoose.Schema.Types.Mixed,
          default: {},
        },
      },
    ],

    subtotal: Number,
    discount: Number,

    // ✅ FIXED
    coupon: CouponSchema,

    total: Number,

    paymentMethod: String,
    paymentStatus: {
      type: String,
      default: "pending",
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,

    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

// 🔥 Force model refresh (Next.js safe)
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.model("Order", OrderSchema);
