"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  increaseQty,
  decreaseQty,
  removeFromCart,
} from "@/store/cartSlice";
import Link from "next/link";

export default function CartPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Prevent hydration mismatch
  if (!mounted) return null;

  if (!items.length) {
    return (
      <div className="p-10 text-center text-lg">
        Your cart is empty
      </div>
    );
  }

  const total = items.reduce(
    (sum, i) => sum + i.price * i.qty,
    0
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cart</h1>

      {items.map((item) => (
        <div
          key={item.cartId}
          className="flex gap-4 items-center border-b py-4"
        >
          <img
            src={item.image}
            alt={item.name}
            className="h-20 w-20 object-cover border"
          />

          <div className="flex-1">
            <p className="font-medium">{item.name}</p>

            {/* OPTIONS */}
            {item.selectedOptions &&
              Object.keys(item.selectedOptions).length > 0 && (
                <p className="text-sm text-gray-500">
                  {Object.entries(item.selectedOptions)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}
                </p>
              )}

            <p className="font-semibold">₹{item.price}</p>
          </div>

          {/* QTY CONTROLS */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                dispatch(decreaseQty(item.cartId))
              }
              className="w-8 h-8 border text-lg"
            >
              −
            </button>

            <span className="w-8 text-center">
              {item.qty}
            </span>

            <button
              onClick={() =>
                dispatch(increaseQty(item.cartId))
              }
              className="w-8 h-8 border text-lg"
            >
              +
            </button>
          </div>

          {/* REMOVE */}
          <button
            onClick={() =>
              dispatch(removeFromCart(item.cartId))
            }
            className="text-red-600 text-sm"
          >
            Remove
          </button>
        </div>
      ))}

      <div className="text-right mt-6">
        <p className="text-lg font-semibold">
          Total: ₹{total}
        </p>

        <Link href="/checkout">
          <button className="mt-4 bg-black text-white px-6 py-3 btn-brand">
            Proceed to Checkout
          </button>
        </Link>
      </div>
    </div>
  );
}
