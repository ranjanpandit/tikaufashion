"use client";

import { useEffect, useState } from "react";

export default function AdminFiltersPage() {
  const [filters, setFilters] = useState([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const [valueInputs, setValueInputs] = useState({});

  function load() {
    fetch("/api/admin/filters")
      .then((r) => r.json())
      .then(setFilters);
  }

  useEffect(load, []);

  async function addFilter(e) {
    e.preventDefault();
    await fetch("/api/admin/filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug,
        values: [],
      }),
    });
    setName("");
    setSlug("");
    load();
  }

  async function addValue(filterId) {
    const input = valueInputs[filterId];
    if (!input) return;

    const [label, value] = input.split(":");

    await fetch("/api/admin/filters/value", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filterId,
        label: label?.trim(),
        value: (value || label)?.trim().toLowerCase(),
      }),
    });

    setValueInputs({ ...valueInputs, [filterId]: "" });
    load();
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Filters</h1>

      {/* ADD FILTER */}
      <form onSubmit={addFilter} className="flex gap-2 mb-6">
        <input
          placeholder="Filter name (Color)"
          className="border p-2 flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="slug (color)"
          className="border p-2 flex-1"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <button className="bg-black text-white px-4">
          Add Filter
        </button>
      </form>

      {/* FILTER LIST */}
      <div className="space-y-6">
        {filters.map((f) => (
          <div key={f._id} className="border p-4">
            <h2 className="font-semibold mb-2">{f.name}</h2>

            {/* VALUES */}
            <div className="flex flex-wrap gap-2 mb-3">
              {f.values.map((v) => (
                <span
                  key={v.value}
                  className="text-xs bg-gray-200 px-2 py-1"
                >
                  {v.label}
                </span>
              ))}
            </div>

            {/* ADD VALUE */}
            <div className="flex gap-2">
              <input
                placeholder="Label[:value]  e.g. Red:red"
                className="border p-2 flex-1"
                value={valueInputs[f._id] || ""}
                onChange={(e) =>
                  setValueInputs({
                    ...valueInputs,
                    [f._id]: e.target.value,
                  })
                }
              />
              <button
                type="button"
                onClick={() => addValue(f._id)}
                className="bg-gray-800 text-white px-4"
              >
                Add Value
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
