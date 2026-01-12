import Link from "next/link";

export default function BestSellingProducts({ products = [] }) {
  if (!products.length) return null;

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-wide mb-8 text-center">
        Best Selling Products
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
              className="group block border rounded-lg overflow-hidden hover:shadow-lg transition bg-white relative"
            >
              {/* DISCOUNT BADGE */}
              {hasDiscount && (
                <span className="absolute top-2 left-2 bg-brand text-white text-xs font-semibold px-2 py-1 rounded z-10">
                  {discountPercent}% OFF
                </span>
              )}

              <img
                src={p.images?.[0]}
                alt={p.name}
                className="h-64 w-full object-cover"
              />

              <div className="p-3">
                <h3 className="text-sm font-medium truncate">
                  {p.name}
                </h3>

                <div className="mt-1 flex items-center gap-2">
                  <span className="font-semibold text-black">
                    ₹{p.price}
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
    </section>
  );
}
