"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { increaseQty, decreaseQty, removeFromCart } from "@/store/cartSlice";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const items = useSelector((state) => state.cart.items || []);
  const [mounted, setMounted] = useState(false);

  // ✅ hooks must be above returns
  const subtotal = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 0), 0);
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((sum, i) => sum + (i.qty || 0), 0);
  }, [items]);

  const shipping = 0;
  const total = subtotal + shipping;

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  /* =========================
     EMPTY CART
  ========================== */
  if (!items.length) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="bg-white border rounded-2xl p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center">
            <ShoppingBag />
          </div>

          <h1 className="text-xl font-bold mt-4">Your cart is empty</h1>
          <p className="text-sm text-gray-600 mt-2">
            Looks like you haven’t added anything yet.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-xl border text-sm font-medium hover:bg-gray-50"
            >
              Continue Shopping
            </button>

            <button
              onClick={() => router.push("/categories")}
              className="px-6 py-3 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90"
            >
              Browse Categories
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* =========================
     UI
  ========================== */
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <h1 className="text-2xl font-bold mt-2">Shopping Cart</h1>
          <p className="text-sm text-gray-600 mt-1">
            {totalItems} item(s)
          </p>
        </div>

        <Link
          href="/"
          className="hidden md:inline-flex px-4 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT: ITEMS */}
        <div className="lg:col-span-3">
          {/* ✅ List header row for desktop */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-2 pb-2 text-xs font-semibold text-gray-500">
            <div className="col-span-7">Product</div>
            <div className="col-span-3 text-center">Qty</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.cartId}
                className="bg-white border rounded-2xl shadow-sm p-3 md:p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center">
                  {/* PRODUCT */}
                  <div className="md:col-span-7 flex gap-3 min-w-0">
                    <div
                      className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border bg-gray-50 shrink-0 cursor-pointer"
                      onClick={() => router.push(`/product/${item.slug}`)}
                    >
                      <img
                        src={item.image || "/placeholder.png"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className="font-semibold text-sm md:text-[15px] line-clamp-2 cursor-pointer hover:underline"
                        onClick={() => router.push(`/product/${item.slug}`)}
                      >
                        {item.name}
                      </p>

                      {item.selectedOptions &&
                        Object.keys(item.selectedOptions).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {Object.entries(item.selectedOptions).map(
                              ([k, v]) => (
                                <span
                                  key={k}
                                  className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700"
                                >
                                  {k}: {String(v)}
                                </span>
                              )
                            )}
                          </div>
                        )}

                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          ₹{item.price} / item
                        </p>

                        {/* ✅ Remove for mobile here */}
                        <button
                          onClick={() =>
                            dispatch(removeFromCart(item.cartId))
                          }
                          className="md:hidden inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                          type="button"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* QTY */}
                  <div className="md:col-span-3 flex md:justify-center">
                    <div className="inline-flex items-center border rounded-xl overflow-hidden">
                      <button
                        onClick={() => dispatch(decreaseQty(item.cartId))}
                        className="w-10 h-10 inline-flex items-center justify-center hover:bg-gray-50"
                        aria-label="Decrease quantity"
                        type="button"
                      >
                        <Minus size={16} />
                      </button>

                      <div className="w-12 h-10 inline-flex items-center justify-center text-sm font-semibold">
                        {item.qty}
                      </div>

                      <button
                        onClick={() => dispatch(increaseQty(item.cartId))}
                        className="w-10 h-10 inline-flex items-center justify-center hover:bg-gray-50"
                        aria-label="Increase quantity"
                        type="button"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* LINE TOTAL + REMOVE */}
                  <div className="md:col-span-2 flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2">
                    <p className="font-bold text-sm md:text-base">
                      ₹{(item.price || 0) * (item.qty || 0)}
                    </p>

                    <button
                      onClick={() => dispatch(removeFromCart(item.cartId))}
                      className="hidden md:inline-flex items-center gap-2 text-xs font-medium text-red-600 hover:text-red-700"
                      type="button"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ✅ Small helpful message */}
          <div className="mt-4 text-xs text-gray-500">
            Tip: Quantity changes are saved instantly.
          </div>
        </div>

        {/* RIGHT: SUMMARY */}
        <div className="lg:col-span-2">
          <div className="bg-white border rounded-2xl p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <Row label="Items" value={`${totalItems}`} />
              <Row label="Subtotal" value={`₹${subtotal}`} />
              <Row
                label="Shipping"
                value={shipping === 0 ? "Free" : `₹${shipping}`}
              />

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Total</span>
                  <span className="font-bold text-lg">₹{total}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <Link href="/checkout" className="block">
                <button className="w-full py-3 rounded-2xl bg-black text-white text-sm font-semibold hover:opacity-90">
                  Proceed to Checkout
                </button>
              </Link>

              <Link href="/" className="block md:hidden">
                <button className="w-full py-3 rounded-2xl border text-sm font-medium hover:bg-gray-50">
                  Continue Shopping
                </button>
              </Link>

              <p className="text-xs text-gray-500">
                Secure checkout • UPI / Cards / COD
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MOBILE STICKY CHECKOUT BAR */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-[9998] px-4 md:hidden">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-base font-bold">₹{total}</p>
            </div>

            <Link href="/checkout">
              <button className="px-5 py-3 rounded-2xl bg-black text-white text-sm font-semibold hover:opacity-90">
                Checkout →
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-20 lg:hidden md:hidden" />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
