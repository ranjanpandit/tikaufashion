import Link from "next/link";
import Pagination from "@/components/category/Pagination";

export default function ProductGrid({ products = [], pagination }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
        {products.map((p) => {
          const hasDiscount = p.mrp && p.mrp > p.price;

          const discountPercent = hasDiscount
            ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
            : 0;

          return (
            <Link
              key={p._id}
              href={`/product/${p.slug}`}
              className="group bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
              style={{ borderRadius: "var(--button-radius)" }}
            >
              {/* IMAGE */}
              <div className="relative bg-gray-100 overflow-hidden">
                {p.images?.[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    className="h-48 sm:h-60 w-full object-cover group-hover:scale-[1.03] transition duration-300"
                  />
                ) : (
                  <div className="h-48 sm:h-60 w-full flex items-center justify-center text-xs text-gray-400">
                    No Image
                  </div>
                )}

                {/* DISCOUNT BADGE */}
                {hasDiscount && (
                  <span className="absolute top-2 left-2 bg-black text-white text-[11px] font-semibold px-2 py-1 rounded-full">
                    {discountPercent}% OFF
                  </span>
                )}

                {/* QUICK VIEW (desktop hover) */}
                <div className="hidden md:block absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition">
                  <div className="bg-white/95 backdrop-blur border rounded-xl px-3 py-2 text-xs text-gray-700 text-center">
                    View Product →
                  </div>
                </div>
              </div>

              {/* INFO */}
              <div className="p-3 sm:p-4">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[40px]">
                  {p.name || "Unnamed Product"}
                </p>

                <div className="mt-2 flex items-end gap-2 flex-wrap">
                  <span
                    className="text-base font-extrabold"
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

                {hasDiscount && (
                  <p className="text-xs text-green-700 font-medium mt-1">
                    Save ₹{p.mrp - p.price}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* PAGINATION */}
      {pagination && (
        <div className="mt-8 md:mt-10">
          <Pagination pagination={pagination} />
        </div>
      )}
    </>
  );
}
