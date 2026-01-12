"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      className="border p-2 text-sm mb-4"
      defaultValue={searchParams.get("sort") || ""}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams.toString());
        if (e.target.value) {
          params.set("sort", e.target.value);
        } else {
          params.delete("sort");
        }
        router.push(`?${params.toString()}`);
      }}
    >
      <option value="">Latest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}
