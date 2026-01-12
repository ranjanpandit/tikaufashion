import mongoose from "mongoose"; // ✅ THIS WAS THE MISSING / WRONG PART

const OrderSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null, // guest checkout
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
        productId: {
          type: mongoose.Schema.Types.ObjectId, // ✅ NOW WORKS
          ref: "Product",
        },
        name: String,
        price: Number,
        qty: Number,
        image: String,
      },
    ],

    total: Number,

    paymentMethod: String, // COD | PREPAID
    paymentStatus: {
      type: String,
      default: "pending", // pending | paid | failed
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,

    status: {
      type: String,
      default: "pending", // pending | shipped | delivered
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);
