"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = searchParams.get("sort") || "";

  function onChange(e) {
    const params = new URLSearchParams(searchParams.toString());
    const value = e.target.value;

    if (!value) params.delete("sort");
    else params.set("sort", value);

    router.push(`?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={onChange}
      className="w-full md:w-auto border rounded-xl px-3 py-2 text-sm bg-white outline-none"
    >
      <option value="">Sort: Recommended</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="latest">Latest</option>
    </select>
  );
}
