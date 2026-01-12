"use client";

import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "@/store/cartSlice";
import { nanoid } from "@reduxjs/toolkit";
import { useState } from "react";

export default function AddToCartButton({
  product,
  selectedOptions,
  variant,
}) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const [showMsg, setShowMsg] = useState("");
  

  function hasSelectedAllOptions() {
    if (!Array.isArray(product.options) || product.options.length === 0) {
      return true;
    }
    return product.options.every(
      (opt) => selectedOptions?.[opt.name]
    );
  }

  const hasVariants =
    Array.isArray(product.variants) &&
    product.variants.length > 1;

  const disabled =
    !hasSelectedAllOptions() ||
    (hasVariants && !variant);

  function handleAdd() {
    if (!hasSelectedAllOptions()) {
      setShowMsg("Please select all options");
      setTimeout(() => setShowMsg(""), 2000);
      return;
    }

    if (hasVariants && !variant) {
      setShowMsg("Selected variant not available");
      setTimeout(() => setShowMsg(""), 2000);
      return;
    }

    const exists = cartItems.find(
      (i) =>
        i.productId === product._id &&
        JSON.stringify(i.selectedOptions) ===
          JSON.stringify(selectedOptions)
    );

    dispatch(
      addToCart({
        cartId: exists ? exists.cartId : nanoid(),
        productId: product._id,
        name: product.name,
        price: variant?.price ?? product.price,
        image: product.images?.[0],
        selectedOptions,
        qty: 1,
      })
    );

    setShowMsg(
      exists ? "Cart updated successfully" : "Added to cart"
    );
    setTimeout(() => setShowMsg(""), 2000);
  }

  return (
    <>
      <button
        disabled={disabled}
        onClick={handleAdd}
        className={`mt-6 px-6 py-3 btn-brand text-white ${
          disabled
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-black"
        }`}
      >
        Add to Cart
      </button>

      {showMsg && (
        <div className="fixed bottom-6 right-6 bg-black text-white px-4 py-2 rounded shadow-lg z-50">
          {showMsg}
        </div>
      )}
    </>
  );
}
