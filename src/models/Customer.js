import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },

    pincode: { type: String, required: true },
    address1: { type: String, required: true },
    address2: { type: String, default: "" },

    city: { type: String, required: true },
    state: { type: String, required: true },
    landmark: { type: String, default: "" },

    type: { type: String, enum: ["home", "office"], default: "home" },

    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const CustomerSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,

    // ✅ NEW
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
