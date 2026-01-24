import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: String,
    couponType: String,
    value: Number,
    discountAmount: { type: Number, default: 0 }, // ✅ snapshot
  },
  { _id: false }
);

const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    pincode: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    landmark: String,
    type: String,
    addressId: String, // optional, reference to customer saved address
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

    shippingAddress: ShippingAddressSchema,

    items: [
      {
        cartId: String,
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        slug: String,
        name: String,
        price: Number, // ✅ snapshot price at time of order
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
    coupon: CouponSchema,

    total: Number,

    paymentMethod: { type: String, enum: ["COD", "PREPAID"] },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    paymentVerifiedAt: Date,
    receipt: String,

    status: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PLACED",
    },
  },
  { timestamps: true }
);

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

export default mongoose.model("Order", OrderSchema);
