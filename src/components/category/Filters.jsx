"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

export default function Filters({ filters = [], mobile = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  function toggleFilter(filterSlug, value) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(filterSlug)?.split(",") || [];

    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    if (updated.length === 0) {
      params.delete(filterSlug);
    } else {
      params.set(filterSlug, updated.join(","));
    }

    router.push(`?${params.toString()}`);
  }

  function clearAll() {
    router.push("?");
  }

  const activeCount = useMemo(() => {
    let count = 0;
    filters.forEach((f) => {
      const val = searchParams.get(f.slug);
      if (val) count += val.split(",").filter(Boolean).length;
    });
    return count;
  }, [filters, searchParams]);

  // Desktop mode = just render content
  if (!mobile) {
    return (
      <div className="space-y-6">
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-red-600 font-medium hover:underline"
          >
            Clear all ({activeCount})
          </button>
        )}

        {filters.map((f) => (
          <div key={f._id || f.slug}>
            <p className="font-semibold text-sm text-gray-900 mb-3">
              {f.name}
            </p>

            <div className="space-y-2">
              {(f.values || []).map((rawValue, index) => {
                const value =
                  typeof rawValue === "string"
                    ? rawValue
                    : String(rawValue.value || rawValue.label || "");

                const label =
                  typeof rawValue === "string"
                    ? rawValue
                    : rawValue.label || rawValue.value || value;

                const active = Boolean(
                  searchParams.get(f.slug)?.split(",").includes(value)
                );

                return (
                  <label
                    key={`${f.slug}-${value}-${index}`}
                    className="flex items-center gap-2 text-sm cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleFilter(f.slug, value)}
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Mobile mode = filter button + drawer
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border bg-white text-sm font-medium"
      >
        <SlidersHorizontal size={18} />
        Filters {activeCount > 0 ? `(${activeCount})` : ""}
      </button>

      {open && (
        <div className="fixed inset-0 z-[99999]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <p className="text-lg font-bold">Filters</p>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 rounded-xl border hover:bg-gray-50 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {filters.map((f) => (
                  <div key={f._id || f.slug}>
                    <p className="font-semibold text-sm text-gray-900 mb-3">
                      {f.name}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {(f.values || []).map((rawValue, index) => {
                        const value =
                          typeof rawValue === "string"
                            ? rawValue
                            : String(rawValue.value || rawValue.label || "");

                        const label =
                          typeof rawValue === "string"
                            ? rawValue
                            : rawValue.label || rawValue.value || value;

                        const active = Boolean(
                          searchParams.get(f.slug)?.split(",").includes(value)
                        );

                        return (
                          <button
                            type="button"
                            key={`${f.slug}-${value}-${index}`}
                            onClick={() => toggleFilter(f.slug, value)}
                            className={`px-3 py-2 rounded-xl border text-sm font-medium ${
                              active
                                ? "bg-black text-white border-black"
                                : "bg-white hover:bg-gray-50"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={clearAll}
                className="flex-1 border py-3 rounded-2xl text-sm font-semibold hover:bg-white"
              >
                Clear All
              </button>

              <button
                onClick={() => setOpen(false)}
                className="flex-1 bg-black text-white py-3 rounded-2xl text-sm font-semibold hover:opacity-90"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
