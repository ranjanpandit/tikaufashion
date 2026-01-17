"use client";

import { useEffect, useMemo, useState } from "react";
import AddToCartButton from "./AddToCartButton";
import Link from "next/link";
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export default function ProductClient({ product }) {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [activeImage, setActiveImage] = useState(null);

  // Accordions
  const [openSection, setOpenSection] = useState("desc"); // desc | shipping | return

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
     VARIANT MATCHING
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
     IMAGES
  ========================== */
  const imageList = useMemo(() => {
    const base = Array.isArray(product.images) ? product.images : [];
    const varImg = variant?.image ? [variant.image] : [];
    const merged = [...varImg, ...base].filter(Boolean);

    // unique
    return Array.from(new Set(merged));
  }, [product.images, variant?.image]);

  const displayImage = useMemo(() => {
    return activeImage || variant?.image || imageList?.[0] || "/no-image.png";
  }, [activeImage, variant?.image, imageList]);

  useEffect(() => {
    // when variant changes, reset to variant image (better UX)
    setActiveImage(null);
  }, [variant?._id]);

  /* =========================
     PRICE DISPLAY
  ========================== */
  const price = variant?.price ?? product.price ?? 0;
  const mrp = variant?.mrp ?? product.mrp ?? null;

  const hasDiscount = mrp && mrp > price;
  const discountPercent = hasDiscount
    ? Math.round(((mrp - price) / mrp) * 100)
    : 0;

  const shortId = product?._id ? String(product._id).slice(-6) : "—";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
      {/* BREADCRUMB */}
      <div className="text-xs text-gray-500 mb-4 flex items-center gap-2">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium line-clamp-1">
          {product.name}
        </span>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
        {/* =========================
            LEFT: IMAGE GALLERY
        ========================== */}
        <div className="space-y-3">
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-[360px] sm:h-[420px] lg:h-[560px] object-cover"
            />
          </div>

          {/* THUMBNAILS */}
          {imageList.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {imageList.map((img) => {
                const active = img === displayImage;
                return (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border bg-white shrink-0 transition ${
                      active ? "border-black" : "hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={img}
                      alt="thumb"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* TRUST STRIP */}
          <div className="grid grid-cols-2 gap-2">
            <TrustChip icon={<Truck size={16} />} text="Fast Delivery" />
            <TrustChip icon={<RotateCcw size={16} />} text="Easy Returns" />
            <TrustChip icon={<ShieldCheck size={16} />} text="Secure Payments" />
            <TrustChip icon={<Sparkles size={16} />} text="Premium Quality" />
          </div>
        </div>

        {/* =========================
            RIGHT: BUY BOX (STICKY)
        ========================== */}
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="bg-white border rounded-2xl shadow-sm p-5">
            {/* TITLE */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold leading-snug">
                  {product.name}
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Product ID: <span className="font-medium">{shortId}</span>
                </p>
              </div>

              {hasDiscount && (
                <span className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full shrink-0">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            {/* PRICE */}
            <div className="mt-4 flex items-end gap-3 flex-wrap">
              <span className="text-2xl font-extrabold text-black">
                ₹{price}
              </span>

              {hasDiscount && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    ₹{mrp}
                  </span>
                  <span className="text-sm font-semibold text-green-700">
                    Save ₹{mrp - price}
                  </span>
                </>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Inclusive of all taxes
            </p>

            {/* OPTIONS */}
            {product.options?.length > 0 && (
              <div className="mt-6 space-y-5">
                {product.options.map((opt) => (
                  <div key={opt.name}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        Select {opt.name}
                      </p>
                      {selectedOptions[opt.name] && (
                        <span className="text-xs text-gray-500">
                          Selected:{" "}
                          <span className="font-medium text-gray-800">
                            {selectedOptions[opt.name]}
                          </span>
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex gap-2 flex-wrap">
                      {opt.values.map((val) => {
                        const active = selectedOptions[opt.name] === val;

                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => selectOption(opt.name, val)}
                            className={`px-4 py-2 text-sm border rounded-xl transition font-medium ${
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

                    {!selectedOptions[opt.name] && (
                      <p className="text-xs text-gray-500 mt-2">
                        Please select {opt.name} to continue.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-6">
              <AddToCartButton
                product={product}
                variant={variant}
                selectedOptions={selectedOptions}
              />

              {/* ✅ helpful message for variant not matched */}
              {product.options?.length > 0 && !allSelected && (
                <p className="text-xs text-gray-500 mt-2">
                  Select options to enable add to cart.
                </p>
              )}
            </div>

            {/* QUICK INFO */}
            <div className="mt-6 border-t pt-4">
              <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                <MiniInfo label="Delivery" value="2–5 days" />
                <MiniInfo label="Return" value="7 days" />
                <MiniInfo label="COD" value="Available" />
                <MiniInfo label="Support" value="10AM–7PM" />
              </div>
            </div>
          </div>

          {/* =========================
              ACCORDION DETAILS
          ========================== */}
          <div className="mt-4 bg-white border rounded-2xl shadow-sm overflow-hidden">
            <Accordion
              title="Product Description"
              open={openSection === "desc"}
              onClick={() =>
                setOpenSection(openSection === "desc" ? "" : "desc")
              }
            >
              {product.description ? (
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-sm text-gray-600">
                  No description available.
                </p>
              )}
            </Accordion>

            <Accordion
              title="Shipping Information"
              open={openSection === "shipping"}
              onClick={() =>
                setOpenSection(openSection === "shipping" ? "" : "shipping")
              }
            >
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Free shipping above ₹999</li>
                <li>• Delivery in 2–5 working days</li>
                <li>• Tracking updates via SMS / Email</li>
              </ul>
            </Accordion>

            <Accordion
              title="Return & Refund Policy"
              open={openSection === "return"}
              onClick={() =>
                setOpenSection(openSection === "return" ? "" : "return")
              }
            >
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 7 days easy return</li>
                <li>• Refund processed in 3–5 business days</li>
                <li>• Product must be unused with tags intact</li>
              </ul>
            </Accordion>
          </div>
        </div>
      </div>

      {/* ✅ MOBILE STICKY BUY BAR */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-[9998] px-4 md:hidden">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">Price</p>
              <p className="text-base font-bold truncate">₹{price}</p>
            </div>

            <div className="min-w-[160px]">
              <AddToCartButton
                product={product}
                variant={variant}
                selectedOptions={selectedOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="h-24 lg:hidden md:hidden" />
    </div>
  );
}

/* =========================
   SMALL COMPONENTS
========================= */

function TrustChip({ icon, text }) {
  return (
    <div className="flex items-center gap-2 bg-white border rounded-2xl px-3 py-2 text-xs text-gray-700 shadow-sm">
      <span className="text-gray-700">{icon}</span>
      <span className="font-medium">{text}</span>
    </div>
  );
}

function MiniInfo({ label, value }) {
  return (
    <div className="bg-gray-50 border rounded-xl p-3">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-xs font-semibold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

function Accordion({ title, open, onClick, children }) {
  return (
    <div className="border-t first:border-t-0">
      <button
        type="button"
        onClick={onClick}
        className="w-full px-5 py-4 flex items-center justify-between text-left"
      >
        <span className="font-semibold text-sm">{title}</span>
        <ChevronDown
          size={18}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}
