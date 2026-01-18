"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function CartIcon() {
  const { items, subtotal, discount, total } = useSelector((state) => state.cart);

  const [open, setOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  const count = useMemo(() => {
    return (items || []).reduce((s, i) => s + (i.qty || 0), 0);
  }, [items]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  // ✅ ESC close + lock scroll
  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* CART ICON */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border hover:bg-gray-50 transition"
        aria-label="Cart"
      >
        <span className="text-lg">🛒</span>

        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-black text-white text-[11px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {/* ✅ DRAWER VIA PORTAL */}
      {portalReady && open
        ? createPortal(
            <MiniCartDrawer
              items={items}
              subtotal={subtotal}
              discount={discount}
              total={total}
              count={count}
              onClose={() => setOpen(false)}
            />,
            document.body
          )
        : null}
    </>
  );
}

/* =========================
   DRAWER UI
========================= */
function MiniCartDrawer({ items = [], subtotal, discount, total, count, onClose }) {
  return (
    <div className="fixed inset-0 z-[99999]">
      {/* BACKDROP */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* PANEL */}
      <div className="absolute right-0 top-0 h-full w-[92%] max-w-md bg-white shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">Cart</p>
            <p className="text-xs text-gray-500">{count} item(s)</p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border hover:bg-gray-50 flex items-center justify-center"
            aria-label="Close cart"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="text-sm text-gray-500 mt-1">
              Add items to continue shopping.
            </p>

            <Link
              href="/"
              onClick={onClose}
              className="mt-5 inline-flex items-center justify-center w-full py-3 rounded-2xl bg-black text-white text-sm font-semibold hover:opacity-90"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* ITEMS */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.cartId}
                  className="border rounded-2xl p-3 flex gap-3"
                >
                  <Link href={`/product/${item.slug}`} onClick={onClose}>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl border object-cover shrink-0"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">
                      {item.name}
                    </p>

                    {item.selectedOptions &&
                      Object.keys(item.selectedOptions).length > 0 && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {Object.entries(item.selectedOptions)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" | ")}
                        </p>
                      )}

                    <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                      <span>
                        ₹{item.price} × {item.qty}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        ₹{item.price * item.qty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* FOOTER (Sticky) */}
            <div className="border-t bg-gray-50 px-5 py-4 space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{subtotal}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount</span>
                    <span className="font-medium">-₹{discount}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-extrabold pt-2 border-t">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex-1 border border-gray-300 text-center py-3 rounded-2xl text-sm font-semibold hover:bg-white transition"
                >
                  View Cart
                </Link>

                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="flex-1 bg-black text-white text-center py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition"
                >
                  Checkout
                </Link>
              </div>

              <p className="text-[11px] text-gray-500">
                Secure checkout. Taxes included where applicable.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
