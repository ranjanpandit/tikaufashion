"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ pagination }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (pagination.totalPages <= 1) return null;

  function goToPage(page) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex justify-center gap-2 mt-10">
      {Array.from(
        { length: pagination.totalPages },
        (_, i) => i + 1
      ).map((p) => (
        <button
          key={p}
          onClick={() => goToPage(p)}
          className={`px-3 py-1 border text-sm ${
            p === pagination.page
              ? "bg-brand text-white border-brand"
              : "hover:bg-gray-100"
          }`}
          style={{ borderRadius: "var(--button-radius)" }}
        >
          {p}
        </button>
      ))}
    </div>
  );
}
