"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { X, Search } from "lucide-react";

export default function MobileSearchModal({ open, onClose }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  // Close on ESC
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setQ("");
      setItems([]);
      setLoading(false);
    }
  }, [open]);

  const trimmed = useMemo(() => q.trim(), [q]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (!trimmed) {
      setItems([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        setLoading(true);

        // ✅ CHANGE API PATH if needed
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(trimmed)}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          setItems([]);
          return;
        }

        setItems(data?.products || []);
      } catch (e) {
        console.log(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [trimmed, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999999] md:hidden">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* PANEL */}
      <div className="absolute left-0 right-0 top-0 bg-white rounded-b-3xl shadow-2xl">
        {/* HEADER */}
        <div className="p-4 border-b flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 border rounded-2xl px-3 py-2 bg-gray-50">
            <Search size={18} className="text-gray-500" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, categories..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 inline-flex items-center justify-center rounded-2xl border hover:bg-gray-50"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[70vh] overflow-y-auto p-4">
          {!trimmed ? (
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-900">Quick Tips</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• Try “kurti”, “jeans”, “tshirt”</li>
                <li>• Search by color: “black”, “blue”</li>
                <li>• Search by type: “cotton”, “party”</li>
              </ul>
            </div>
          ) : loading ? (
            <p className="text-sm text-gray-600">Searching...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-600">
              No results for <b>{trimmed}</b>
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <Link
                  key={p._id}
                  href={`/product/${p.slug}`}
                  onClick={onClose}
                  className="flex gap-3 border rounded-2xl p-3 hover:bg-gray-50 transition"
                >
                  <img
                    src={p.image || "/placeholder.png"}
                    alt={p.name}
                    className="w-14 h-14 rounded-xl border object-cover"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">{p.name}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                      {p.shortDesc || p.categoryName || ""}
                    </p>
                    <p className="text-sm font-bold mt-1">₹{p.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-black text-white text-sm font-semibold hover:opacity-90"
          >
            Close Search
          </button>
        </div>
      </div>
    </div>
  );
}
