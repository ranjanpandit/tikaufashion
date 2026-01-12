import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["flat", "percentage"],
      required: true,
    },

    value: {
      type: Number,
      required: true,
    },

    minOrder: {
      type: Number,
      default: 0,
    },

    maxDiscount: {
      type: Number,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    usageLimit: {
      type: Number,
      default: null, // unlimited
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon ||
  mongoose.model("Coupon", CouponSchema);
