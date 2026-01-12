import { notFound } from "next/navigation";
import ProductGrid from "@/components/category/ProductGrid";
import Filters from "@/components/category/Filters";
import SortSelect from "@/components/category/SortSelect";

async function getCategoryProducts(slug, rawSearchParams) {
  const params = new URLSearchParams();

  // mandatory category
  params.set("category", slug);

  // ✅ unwrap searchParams safely
  const searchParams = await rawSearchParams;

  if (searchParams && typeof searchParams === "object") {
    for (const key of Object.keys(searchParams)) {
      const value = searchParams[key];
      if (typeof value === "string") {
        params.set(key, value);
      }
    }
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/products?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;
  return res.json();
}
async function getCategoryFilters(slug) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/filters?category=${slug}`,
    { cache: "no-store" }
  );
  return res.json();
}

export default async function CategoryPage({ params, searchParams }) {
  // ✅ unwrap params
  const { slug } = await params;

  const data = await getCategoryProducts(slug, searchParams);
  const filters = await getCategoryFilters(slug);

  if (!data) return notFound();

  const { category, products, pagination } = data;

  return (
    <div
      className="max-w-7xl mx-auto px-4 py-10"
      style={{ fontFamily: "var(--font-family)" }}
    >
      {/* CATEGORY HEADER */}
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--brand-primary)" }}
        >
          {category.name}
        </h1>

        {category.description && (
          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* FILTER SIDEBAR (NEXT STEP) */}
        <aside className="hidden md:block">
          <Filters filters={filters} />
        </aside>

        {/* PRODUCTS */}
        <section className="md:col-span-3">
          {products.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              No products found in this category.
            </div>
          ) : (
            <>
              <SortSelect />

              <ProductGrid products={products} pagination={pagination} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
