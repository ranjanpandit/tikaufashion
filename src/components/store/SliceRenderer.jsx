import Hero from "@/components/store/Hero";
import FeaturedProducts from "@/components/store/FeaturedProducts";
import BestSellingProducts from "@/components/store/BestSellingProducts";

export default function SliceRenderer({ slices, store, bestSellers }) {
  if (!slices?.length) return null;

  return (
    <div className="flex flex-col">
      {slices.map((slice, i) => {
        switch (slice.type) {
          case "hero":
            return (
              <section key={i} className="w-full">
                <Hero banners={store.banners || []} />
              </section>
            );

          case "featured":
            return (
              <section
                key={i}
                className="bg-gray-50 py-14"
              >
                <div className="max-w-7xl mx-auto px-4">
                  <SectionHeader
                    title="Featured Collection"
                    subtitle="Handpicked styles just for you"
                  />

                  <FeaturedProducts
                    products={store.featuredProducts || []}
                  />
                </div>
              </section>
            );

          case "best_selling":
            return (
              <section
                key={i}
                className="bg-white py-14"
              >
                <div className="max-w-7xl mx-auto px-4">
                  <SectionHeader
                    title="Best Sellers"
                    subtitle="Most loved by our customers"
                  />

                  <BestSellingProducts
                    products={bestSellers}
                  />
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

/* =========================
   SECTION HEADER
========================= */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-10 text-center">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-wide">
        {title}
      </h2>
      <p className="mt-2 text-gray-600 text-sm md:text-base">
        {subtitle}
      </p>
    </div>
  );
}
