"use client";

import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/store/cartSlice";
import { nanoid } from "@reduxjs/toolkit";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShoppingCart, Loader2 } from "lucide-react";

export default function AddToCartButton({ product, selectedOptions, variant }) {
  const dispatch = useDispatch();
  const router = useRouter();

  const cartItems = useSelector((state) => state.cart.items || []);

  const [toast, setToast] = useState("");
  const [clickedOnce, setClickedOnce] = useState(false);
  const [adding, setAdding] = useState(false);

  const toastTimerRef = useRef(null);

  const hasOptions =
    Array.isArray(product?.options) && product.options.length > 0;

  const hasVariants =
    Array.isArray(product?.variants) && product.variants.length > 1;

  function hasSelectedAllOptions() {
    if (!hasOptions) return true;
    return product.options.every((opt) => selectedOptions?.[opt.name]);
  }

  const firstMissingOptionName = useMemo(() => {
    if (!hasOptions) return "";
    const missing = product.options.find((opt) => !selectedOptions?.[opt.name]);
    return missing?.name || "";
  }, [hasOptions, product.options, selectedOptions]);

  const disabled = !hasSelectedAllOptions() || (hasVariants && !variant);

  /* ✅ Variant-safe image for cart */
  const cartImage = useMemo(() => {
    return variant?.image || product?.images?.[0] || "/no-image.png";
  }, [variant?.image, product?.images]);

  /* ✅ Check if same variant/options already exists in cart */
  const exists = useMemo(() => {
    return cartItems.find(
      (i) =>
        i.productId === product?._id &&
        JSON.stringify(i.selectedOptions || {}) ===
          JSON.stringify(selectedOptions || {})
    );
  }, [cartItems, product?._id, selectedOptions]);

  /* ✅ IMPORTANT: On option change, button must reset to Add to Cart */
  useEffect(() => {
    setClickedOnce(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(selectedOptions || {}),
    variant?._id,
    variant?.sku,
    variant?.price,
    variant?.image,
  ]);

  function showToast(msg) {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 1800);
  }

  async function handleClick() {
    // ✅ Only clickedOnce controls "Go to Cart"
    if (clickedOnce) {
      router.push("/cart");
      return;
    }

    if (!hasSelectedAllOptions()) {
      showToast(`Please select ${firstMissingOptionName}`);
      return;
    }

    if (hasVariants && !variant) {
      showToast("Selected variant not available");
      return;
    }

    try {
      setAdding(true);

      dispatch(
        addToCart({
          cartId: exists ? exists.cartId : nanoid(),
          productId: product._id,
          name: product.name,
          slug: product.slug,
          price: variant?.price ?? product.price,
          image: cartImage,
          variantSku: variant?.sku || null,
          selectedOptions: selectedOptions || {},
          qty: 1,
        })
      );

      setClickedOnce(true);
      showToast(exists ? "Cart updated" : "Added to cart");
    } catch (e) {
      console.log(e);
      showToast("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  }

  /* ✅ Button label */
  const buttonLabel = useMemo(() => {
    if (clickedOnce) return "Go to Cart";

    if (!hasSelectedAllOptions() && firstMissingOptionName)
      return `Select ${firstMissingOptionName}`;

    return "Add to Cart";
  }, [clickedOnce, hasSelectedAllOptions, firstMissingOptionName]);

  return (
    <>
      <button
        type="button"
        disabled={disabled || adding}
        onClick={handleClick}
        className={`w-full px-5 py-3 rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2
          ${
            clickedOnce
              ? "bg-white border border-black text-black hover:bg-gray-50"
              : disabled
              ? "bg-gray-300 text-white cursor-not-allowed"
              : "bg-black text-white hover:opacity-90"
          }
          ${adding ? "opacity-80" : ""}
        `}
      >
        {adding ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Adding...
          </>
        ) : clickedOnce ? (
          <>
            <ShoppingCart size={18} />
            {buttonLabel}
          </>
        ) : (
          <>
            <CheckCircle2 size={18} />
            {buttonLabel}
          </>
        )}
      </button>

      {/* ✅ Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-[99999]">
          <div className="bg-black text-white px-4 py-3 rounded-2xl shadow-xl text-sm">
            {toast}
          </div>
        </div>
      )}
    </>
  );
}
