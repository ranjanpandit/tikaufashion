"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";

export default function CartIcon() {
  const { items, subtotal, discount, total } = useSelector(
    (state) => state.cart
  );

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const count = items.reduce((s, i) => s + i.qty, 0);

  /* =========================
     CLOSE ON OUTSIDE CLICK
  ========================== */
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* CART ICON */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition"
      >
        <span className="text-xl">🛒</span>

        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-[11px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {count}
          </span>
        )}
      </button>

      {/* =========================
         MINI CART
      ========================== */}
      {open && (
        <div
          className="
            absolute top-full mt-3
            w-[calc(100vw-24px)]
            max-w-[360px]
            right-1/2 translate-x-1/2
            md:right-0 md:translate-x-0
            bg-white border rounded-xl shadow-xl
            z-50 overflow-hidden
          "
        >
          {/* HEADER */}
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <h4 className="font-semibold text-sm">Cart ({count} items)</h4>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* EMPTY */}
          {items.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Your cart is empty
            </div>
          ) : (
            <>
              {/* ITEMS */}
              <div className="max-h-[300px] overflow-y-auto divide-y">
                {items.map((item) => (
                  <div key={item.cartId} className="flex gap-3 p-4 text-sm">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-md border"
                    />

                    <div className="flex-1">
                      <p className="font-medium leading-tight line-clamp-2">
                        {item.name}
                      </p>

                      {item.selectedOptions &&
                        Object.keys(item.selectedOptions).length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {Object.entries(item.selectedOptions)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                          </p>
                        )}

                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">Qty: {item.qty}</span>
                        <span className="font-semibold">
                          ₹{item.price * item.qty}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER (STICKY) */}
              <div className="border-t bg-gray-50 px-4 py-4 space-y-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-semibold text-base pt-1">
                    <span>Total</span>
                    <span>₹{total}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href="/cart"
                    onClick={() => setOpen(false)}
                    className="flex-1 border border-gray-300 text-center py-2 rounded-md text-sm hover:bg-gray-100 transition"
                  >
                    View Cart
                  </Link>

                  <Link
                    href="/checkout"
                    onClick={() => setOpen(false)}
                    className="flex-1 bg-black text-white text-center py-2 rounded-md text-sm hover:opacity-90 transition"
                  >
                    Checkout
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
