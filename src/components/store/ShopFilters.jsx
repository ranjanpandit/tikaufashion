"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ShopFilters() {
  const [filters, setFilters] = useState([]);
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    fetch("/api/filters")
      .then((r) => r.json())
      .then(setFilters);
  }, []);

  function toggle(slug, value) {
    const search = new URLSearchParams(params.toString());
    const key = `f_${slug}`;

    const existing = search.getAll(key);
    search.delete(key);

    const updated = existing.includes(value)
      ? existing.filter((v) => v !== value)
      : [...existing, value];

    updated.forEach((v) => search.append(key, v));
    router.push(`/shop?${search.toString()}`);
  }

  return (
    <div className="space-y-6">
      {filters.map((f) => (
        <div key={f._id}>
          <p className="font-medium mb-2">{f.name}</p>
          {f.values.map((v) => (
            <label key={v.value} className="block text-sm">
              <input
                type="checkbox"
                checked={params
                  .getAll(`f_${f.slug}`)
                  .includes(v.value)}
                onChange={() => toggle(f.slug, v.value)}
              />{" "}
              {v.label}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
