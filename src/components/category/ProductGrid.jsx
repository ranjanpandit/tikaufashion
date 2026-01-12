import Link from "next/link";
import Pagination from "@/components/category/Pagination";

export default function ProductGrid({ products = [], pagination }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((p) => {
          const hasDiscount =
            p.mrp && p.mrp > p.price;

          const discountPercent = hasDiscount
            ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
            : 0;

          return (
            <Link
              key={p._id}
              href={`/product/${p.slug}`}
              className="group border rounded-md overflow-hidden bg-white hover:shadow-md transition relative"
              style={{ borderRadius: "var(--button-radius)" }}
            >
              {/* DISCOUNT BADGE */}
              {hasDiscount && (
                <span className="absolute top-2 left-2 bg-brand text-white text-xs font-semibold px-2 py-1 rounded z-10">
                  {discountPercent}% OFF
                </span>
              )}

              {/* IMAGE */}
              <div className="relative h-60 bg-gray-100 overflow-hidden">
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* INFO */}
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium line-clamp-2">
                  {p.name || "Unnamed Product"}
                </p>

                <div className="flex items-center gap-2">
                  <span
                    className="text-base font-semibold"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    ₹{p.price ?? "--"}
                  </span>

                  {hasDiscount && (
                    <span className="text-sm text-gray-500 line-through">
                      ₹{p.mrp}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* PAGINATION */}
      {pagination && (
        <div className="mt-10">
          <Pagination pagination={pagination} />
        </div>
      )}
    </>
  );
}
