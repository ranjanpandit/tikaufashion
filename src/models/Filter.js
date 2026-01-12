import mongoose from "mongoose";

const FilterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // Size, Color, Fabric
    },
    slug: {
      type: String,
      required: true, // size, color, fabric
      unique: true,
    },
    type: {
      type: String,
      enum: ["checkbox", "radio"],
      default: "checkbox",
    },
    values: [
      {
        label: String, // Red
        value: String, // red
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Filter ||
  mongoose.model("Filter", FilterSchema);
