"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function Faq({
  title = "Frequently Asked Questions",
  subtitle = "Quick answers to common questions.",
  items = [],
  defaultOpenIndex = 0,
}) {
  const safeItems = useMemo(() => {
    return Array.isArray(items) ? items.filter(Boolean) : [];
  }, [items]);

  const [openIndex, setOpenIndex] = useState(
    safeItems.length ? defaultOpenIndex : -1
  );

  function toggle(i) {
    setOpenIndex((prev) => (prev === i ? -1 : i));
  }

  if (!safeItems.length) {
    return (
      <div className="border rounded-2xl bg-white p-6">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>

        <div className="mt-4 text-sm text-gray-500">
          No FAQs available right now.
        </div>
      </div>
    );
  }

  return (
    <section className="border rounded-2xl bg-white overflow-hidden">
      {/* HEADER */}
      <div className="px-6 py-5 border-b bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>

      {/* ITEMS */}
      <div className="divide-y">
        {safeItems.map((faq, i) => {
          const active = openIndex === i;

          return (
            <div key={faq.id || `${faq.question}-${i}`} className="px-6">
              <button
                type="button"
                onClick={() => toggle(i)}
                className="w-full py-4 flex items-center justify-between gap-3 text-left"
              >
                <p className="font-semibold text-sm md:text-base text-gray-900">
                  {faq.question}
                </p>

                <span
                  className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition ${
                    active ? "bg-black text-white border-black" : "bg-white"
                  }`}
                >
                  <ChevronDown
                    size={18}
                    className={`transition ${active ? "rotate-180" : ""}`}
                  />
                </span>
              </button>

              {active && (
                <div className="pb-5 -mt-1">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
