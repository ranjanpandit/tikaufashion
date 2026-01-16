"use client";

import { useState, useEffect, useMemo } from "react";
import AddToCartButton from "./AddToCartButton";

export default function ProductClient({ product }) {
  const [selectedOptions, setSelectedOptions] = useState({});

  /* =========================
     AUTO SELECT SINGLE OPTION
  ========================== */
  useEffect(() => {
    if (
      product.options?.length === 1 &&
      product.options[0].values?.length === 1
    ) {
      setSelectedOptions({
        [product.options[0].name]: product.options[0].values[0],
      });
    }
  }, [product]);

  function selectOption(optionName, value) {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  }

  /* =========================
     VARIANT MATCHING (FULL MATCH ONLY)
  ========================== */
  const allSelected = useMemo(() => {
    if (!Array.isArray(product.options) || product.options.length === 0)
      return true;

    return product.options.every((opt) => selectedOptions?.[opt.name]);
  }, [product.options, selectedOptions]);

  const variant = useMemo(() => {
    if (!allSelected) return null;

    return (
      product.variants?.find((v) =>
        Object.entries(selectedOptions).every(
          ([key, val]) => v.options?.[key] === val
        )
      ) || null
    );
  }, [product.variants, selectedOptions, allSelected]);

  /* =========================
     IMAGE / PRICE DISPLAY
  ========================== */
  const displayImage =
    variant?.image || product.images?.[0] || "/no-image.png";

  const price = variant?.price ?? product.price;
  const mrp = variant?.mrp ?? product.mrp;

  const hasDiscount = mrp && mrp > price;
  const discountPercent = hasDiscount
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-10 grid md:grid-cols-2 gap-8 md:gap-10">
      {/* =========================
          IMAGES
      ========================== */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-[360px] sm:h-[420px] md:h-[520px] object-cover"
        />
      </div>

      {/* =========================
          PRODUCT INFO
      ========================== */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold">
          {product.name}
        </h1>

        {/* PRICE BLOCK */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <span className="text-2xl font-bold text-black">
            ₹{price}
          </span>

          {hasDiscount && (
            <>
              <span className="text-lg text-gray-500 line-through">
                ₹{mrp}
              </span>
              <span className="text-sm font-semibold text-green-600">
                {discountPercent}% OFF
              </span>
            </>
          )}
        </div>

        {/* TAX INFO */}
        <p className="text-sm text-gray-500 mt-1">
          Inclusive of all taxes
        </p>

        {/* OPTIONS */}
        {product.options?.length > 0 && (
          <div className="mt-6 space-y-5">
            {product.options.map((opt) => (
              <div key={opt.name}>
                <p className="text-sm font-medium mb-2">
                  Select {opt.name}
                </p>

                <div className="flex gap-2 flex-wrap">
                  {opt.values.map((val) => {
                    const active = selectedOptions[opt.name] === val;

                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => selectOption(opt.name, val)}
                        className={`px-4 py-2 text-sm border rounded-lg transition
                          ${
                            active
                              ? "border-black bg-black text-white"
                              : "bg-white hover:border-black"
                          }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>

                {/* ✅ helpful message if not selected */}
                {!selectedOptions[opt.name] && (
                  <p className="text-xs text-gray-500 mt-2">
                    Please select {opt.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TRUST BADGES */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
          <div>🚚 Free Shipping Above ₹999</div>
          <div>🔄 7 Days Easy Return</div>
          <div>🔒 Secure Payments</div>
          <div>⭐ Premium Quality</div>
        </div>

        {/* ADD TO CART */}
        <div className="mt-6">
          <AddToCartButton
            product={product}
            variant={variant}
            selectedOptions={selectedOptions}
          />
        </div>

        {/* DESCRIPTION */}
        {product.description && (
          <div
            className="prose max-w-none mt-8"
            dangerouslySetInnerHTML={{
              __html: product.description,
            }}
          />
        )}
      </div>
    </div>
  );
}
