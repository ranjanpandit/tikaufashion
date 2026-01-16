import mongoose from "mongoose";

/* =========================
   VARIANT (NO MAP ❌)
========================= */
const VariantSchema = new mongoose.Schema(
  {
    options: {
      type: Object, // ✅ PLAIN OBJECT ONLY
      default: {}, // { Size: "M", Color: "Red" }
    },
    mrp: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    sku: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

/* =========================
   OPTIONS
========================= */
const OptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    values: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

/* =========================
   PRODUCT
========================= */
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true },
    // ✅ NEW: Product SKU / Model No
    productSku: {
      type: String,
      default: "",
      index: true,
    },

    description: { type: String, default: "" },

    mrp: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },

    images: {
      type: [String],
      default: [],
    },

    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    options: {
      type: [OptionSchema],
      default: [],
    },

    variants: {
      type: [VariantSchema],
      default: [],
    },

    filters: {
      type: Object,
      default: {},
    },

    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
