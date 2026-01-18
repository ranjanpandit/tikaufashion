import mongoose from "mongoose";

const StaticPageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: String, default: "" }, // HTML (from editor)

    status: { type: String, enum: ["draft", "published"], default: "draft" },

    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      ogImage: { type: String, default: "" },
    },

    showInHeader: { type: Boolean, default: false },
    showInFooter: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.StaticPage ||
  mongoose.model("StaticPage", StaticPageSchema);
