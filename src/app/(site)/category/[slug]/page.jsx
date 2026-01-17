import { notFound } from "next/navigation";
import ProductGrid from "@/components/category/ProductGrid";
import Filters from "@/components/category/Filters";
import SortSelect from "@/components/category/SortSelect";

async function getCategoryProducts(slug, rawSearchParams) {
  const params = new URLSearchParams();
  params.set("category", slug);

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
  const { slug } = await params;

  const data = await getCategoryProducts(slug, searchParams);
  const filters = await getCategoryFilters(slug);

  if (!data) return notFound();

  const { category, products, pagination } = data;

  return (
    <div
      className="max-w-7xl mx-auto px-4 py-6 md:py-10"
      style={{ fontFamily: "var(--font-family)" }}
    >
      {/* HEADER */}
      <div className="mb-6 md:mb-8 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1
              className="text-2xl md:text-3xl font-extrabold"
              style={{ color: "var(--brand-primary)" }}
            >
              {category?.name || "Category"}
            </h1>

            {category?.description && (
              <p className="text-sm text-gray-600 mt-1 max-w-2xl">
                {category.description}
              </p>
            )}
          </div>

          {/* Desktop result count */}
          <div className="hidden md:block text-sm text-gray-600 mt-1">
            Showing <b>{products?.length || 0}</b> items
          </div>
        </div>

        {/* MOBILE TOOLBAR (Sort + Filter) */}
        <div className="md:hidden flex items-center justify-between gap-3">
          <Filters filters={filters} mobile />

          <div className="flex-1">
            <SortSelect />
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
        {/* FILTER SIDEBAR */}
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <div className="bg-white border rounded-2xl shadow-sm p-5">
              <p className="font-semibold mb-4 text-gray-900">Filters</p>
              <Filters filters={filters} />
            </div>
          </div>
        </aside>

        {/* PRODUCTS */}
        <section className="md:col-span-3">
          {/* Desktop toolbar */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {pagination?.total ? (
                <>
                  Total: <b>{pagination.total}</b> products
                </>
              ) : (
                <>
                  Showing <b>{products?.length || 0}</b> products
                </>
              )}
            </p>

            <SortSelect />
          </div>

          {products.length === 0 ? (
            <div className="bg-white border rounded-2xl p-10 text-center text-gray-600">
              <p className="text-lg font-semibold">No products found</p>
              <p className="text-sm mt-1">
                Try removing some filters or change sorting.
              </p>
            </div>
          ) : (
            <ProductGrid products={products} pagination={pagination} />
          )}
        </section>
      </div>
    </div>
  );
}
