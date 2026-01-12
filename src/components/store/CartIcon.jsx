"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";

export default function CartIcon() {
  const items = useSelector((state) => state.cart.items);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const count = items.reduce((s, i) => s + i.qty, 0);
  const subtotal = items.reduce(
    (s, i) => s + i.price * i.qty,
    0
  );

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
    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* CART ICON (CLICKABLE) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-block"
      >
        🛒
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {count}
          </span>
        )}
      </button>

      {/* =========================
         MINI CART
      ========================== */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 bg-white border shadow-2xl rounded-lg z-50">
          {items.length === 0 ? (
            <div className="p-4 text-sm text-center text-gray-500">
              Your cart is empty
            </div>
          ) : (
            <>
              {/* ITEMS */}
              <div className="max-h-64 overflow-y-auto divide-y">
                {items.map((item) => (
                  <div
                    key={item.cartId}
                    className="flex gap-3 p-3 text-sm"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-cover border rounded"
                    />

                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">
                        {item.name}
                      </p>

                      {item.selectedOptions &&
                        Object.keys(item.selectedOptions)
                          .length > 0 && (
                          <p className="text-xs text-gray-500">
                            {Object.entries(
                              item.selectedOptions
                            )
                              .map(
                                ([k, v]) =>
                                  `${k}: ${v}`
                              )
                              .join(", ")}
                          </p>
                        )}

                      <p className="mt-1">
                        ₹{item.price} × {item.qty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* FOOTER */}
              <div className="border-t p-4">
                <div className="flex justify-between font-semibold mb-3">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href="/cart"
                    onClick={() => setOpen(false)}
                    className="flex-1 border text-center py-2 rounded text-sm hover:bg-gray-50"
                  >
                    View Cart
                  </Link>

                  <Link
                    href="/checkout"
                    onClick={() => setOpen(false)}
                    className="flex-1 bg-black text-white text-center py-2 rounded text-sm hover:opacity-90"
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
