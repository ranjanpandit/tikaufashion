import { connectMongo } from "@/lib/mongodb";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Store from "@/models/Store";
import { NextResponse } from "next/server";

export async function GET() {
  await connectMongo();

  // 1️⃣ Check admin-curated best sellers first
  const store = await Store.findOne()
    .populate("bestSellingProducts", "name images price slug");

  if (store?.bestSellingProducts?.length) {
    return NextResponse.json(store.bestSellingProducts);
  }

  // 2️⃣ Auto-calculate from orders
  const result = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.productId",
        totalSold: { $sum: "$items.qty" },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 8 },
  ]);

  const productIds = result.map((r) => r._id);

  const products = await Product.find({
    _id: { $in: productIds },
    status: true,
  });

  return NextResponse.json(products);
}
