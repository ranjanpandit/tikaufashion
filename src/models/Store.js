import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "TikauFashion",
    },

    logo: String,

    banners: [
      {
        image: String,
        link: String,
      },
    ],

    featuredProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    bestSellingProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // ✅ THIS WAS MISSING / NOT REGISTERED
    homepageSlices: [
      {
        type: {
          type: String,
          required: true,
        },
        title: String,
        data: mongoose.Schema.Types.Mixed,
      },
    ],
    theme: {
      preset: {
        type: String,
        default: "default",
      },
      primaryColor: {
        type: String,
        default: "#000000",
      },
      secondaryColor: {
        type: String,
        default: "#666666",
      },
      buttonRadius: {
        type: String,
        default: "0.375rem", // rounded-md
      },
      fontFamily: {
        type: String,
        default: "Inter, system-ui, sans-serif",
      },
    },
    menu: [
      {
        label: String,
        slug: String,
        type: {
          type: String, // link | mega
          default: "link",
        },
        columns: [
          {
            title: String,
            links: [
              {
                label: String,
                href: String,
              },
            ],
          },
        ],
        order: Number,
        active: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);
