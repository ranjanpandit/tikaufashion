import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["super_admin", "manager", "support"],
      default: "manager",
    },

    permissions: {
      orders: { type: Boolean, default: true },
      products: { type: Boolean, default: true },
      store: { type: Boolean, default: true },
      coupons: { type: Boolean, default: true },
      pages: { type: Boolean, default: true },
      adminUsers: { type: Boolean, default: false },
    },

    isActive: { type: Boolean, default: true },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.AdminUser ||
  mongoose.model("AdminUser", AdminUserSchema);
