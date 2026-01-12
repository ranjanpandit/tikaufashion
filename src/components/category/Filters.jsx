"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Filters({ filters }) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  return (
    <div className="space-y-6">
      {(filters || []).map((f) => (
        <div key={f._id || f.slug}>
          <p
            className="font-medium mb-2 text-sm"
            style={{ color: "var(--brand-primary)" }}
          >
            {f.name}
          </p>

          <div className="space-y-1">
            {(f.values || []).map((rawValue, index) => {
              // Normalize value/label safely
              const value =
                typeof rawValue === "string"
                  ? rawValue
                  : String(rawValue.value || rawValue.label || "");

              const label =
                typeof rawValue === "string"
                  ? rawValue
                  : rawValue.label || rawValue.value || value;

              // ✅ ALWAYS boolean
              const active = Boolean(
                searchParams
                  .get(f.slug)
                  ?.split(",")
                  .includes(value)
              );

              return (
                <label
                  key={`${f.slug}-${value}-${index}`}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={active}          // ✅ never undefined
                    onChange={() =>
                      toggleFilter(f.slug, value)
                    }
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
