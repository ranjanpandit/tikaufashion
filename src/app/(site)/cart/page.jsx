"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  increaseQty,
  decreaseQty,
  removeFromCart,
} from "@/store/cartSlice";
import Link from "next/link";

export default function CartPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const items = useSelector((state) => state.cart.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Cart</h1>

      {items.map((item) => (
        <div
          key={item.cartId}
          className="
            border-b py-4
            flex flex-col gap-4
            md:flex-row md:items-center md:gap-4
          "
        >
          {/* CLICKABLE PRODUCT */}
          <div
            className="flex gap-4 flex-1 cursor-pointer"
            onClick={() =>
              router.push(`/product/${item.slug}`)
            }
          >
            <img
              src={item.image}
              alt={item.name}
              className="h-20 w-20 object-cover border rounded shrink-0"
            />

            <div>
              <p className="font-medium hover:underline">
                {item.name}
              </p>

              {item.selectedOptions &&
                Object.keys(item.selectedOptions).length >
                  0 && (
                  <p className="text-sm text-gray-500">
                    {Object.entries(item.selectedOptions)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ")}
                  </p>
                )}

              <p className="font-semibold mt-1">
                ₹{item.price}
              </p>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            {/* QTY CONTROLS */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  dispatch(decreaseQty(item.cartId))
                }
                className="w-8 h-8 border text-lg rounded"
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
                className="w-8 h-8 border text-lg rounded"
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
        </div>
      ))}

      {/* FOOTER */}
      <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <p className="text-lg font-semibold text-right md:text-left">
          Total: ₹{total}
        </p>

        <Link href="/checkout">
          <button className="w-full md:w-auto bg-black text-white px-6 py-3 rounded-md font-medium">
            Proceed to Checkout
          </button>
        </Link>
      </div>
    </div>
  );
}
