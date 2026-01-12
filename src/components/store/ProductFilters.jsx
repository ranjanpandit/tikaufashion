"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function ProductFilters() {
  const router = useRouter();
  const params = useSearchParams();

  function updateFilter(key, value) {
    const search = new URLSearchParams(params.toString());

    if (value) {
      search.set(key, value);
    } else {
      search.delete(key);
    }

    router.push(`/shop?${search.toString()}`);
  }

  return (
    <div className="border p-4 space-y-6">
      <h2 className="font-semibold text-lg">Filters</h2>

      {/* Size */}
      <div>
        <p className="font-medium mb-2">Size</p>
        {["S", "M", "L", "XL", "XXL"].map((s) => (
          <label key={s} className="block text-sm">
            <input
              type="radio"
              name="size"
              checked={params.get("size") === s}
              onChange={() => updateFilter("size", s)}
            />{" "}
            {s}
          </label>
        ))}
        <button
          onClick={() => updateFilter("size", null)}
          className="text-xs text-blue-600 mt-1"
        >
          Clear
        </button>
      </div>

      {/* Color */}
      <div>
        <p className="font-medium mb-2">Color</p>
        {["Red", "Blue", "Black", "White", "Green"].map((c) => (
          <label key={c} className="block text-sm">
            <input
              type="radio"
              name="color"
              checked={params.get("color") === c}
              onChange={() => updateFilter("color", c)}
            />{" "}
            {c}
          </label>
        ))}
        <button
          onClick={() => updateFilter("color", null)}
          className="text-xs text-blue-600 mt-1"
        >
          Clear
        </button>
      </div>

      {/* Price */}
      <div>
        <p className="font-medium mb-2">Price</p>
        {[500, 1000, 2000].map((p) => (
          <label key={p} className="block text-sm">
            <input
              type="radio"
              name="price"
              checked={params.get("maxPrice") === String(p)}
              onChange={() => updateFilter("maxPrice", p)}
            />{" "}
            Under ₹{p}
          </label>
        ))}
        <button
          onClick={() => updateFilter("maxPrice", null)}
          className="text-xs text-blue-600 mt-1"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
