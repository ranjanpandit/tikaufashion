"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { applyCoupon, removeCoupon, clearCart } from "@/store/cartSlice";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const {
    items: cart,
    subtotal,
    discount,
    total,
    coupon,
  } = useSelector((state) => state.cart);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* =========================
     FORM STATE
  ========================== */
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("COD");

  /* =========================
     COUPON INPUT STATE
  ========================== */
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  /* =========================
     HYDRATION SAFE
  ========================== */
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (!cart.length) {
    return <div className="p-10 text-center">Your cart is empty</div>;
  }

  /* =========================
     ADDRESS VALIDATION
  ========================== */
  function validateForm() {
    const e = {};
    if (!form.name.trim()) e.name = "Name required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Invalid email";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "10 digit phone required";
    if (!form.line1.trim()) e.line1 = "Address required";
    if (!form.city.trim()) e.city = "City required";
    if (!form.state.trim()) e.state = "State required";
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "6 digit pincode required";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  /* =========================
     APPLY COUPON
  ========================== */
  async function applyCouponHandler() {
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput,
          subtotal,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.message);
        dispatch(removeCoupon());
        return;
      }

      dispatch(
        applyCoupon({
          code: data.code,
          type: data.type, // "PERCENT" | "FLAT"
          value: data.value, // 10 or 200
          maxDiscount: data.maxDiscount, // optional
        })
      );
    } catch {
      setCouponError("Failed to apply coupon");
    }
  }

  function removeCouponHandler() {
    setCouponInput("");
    setCouponError("");
    dispatch(removeCoupon());
  }

  /* =========================
     RAZORPAY LOADER
  ========================== */
  function loadRazorpay() {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  /* =========================
     PLACE ORDER
  ========================== */
  async function placeOrder() {
    setLoading(true);

    const payload = {
      customer: {
        name: form.name,
        email: form.email,
        phone: form.phone,
      },
      address: {
        line1: form.line1,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
      items: cart,
      subtotal,
      discount,
      coupon: appliedCoupon,
      total,
      paymentMethod,
    };

    try {
      if (paymentMethod === "COD") {
        await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        dispatch(clearCart());
        router.push("/order-success");
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed");

      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });

      const razorpayOrder = await orderRes.json();

      new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: "INR",
        name: "TikauFashion",
        order_id: razorpayOrder.id,
        handler: async (response) => {
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...payload,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            }),
          });

          dispatch(clearCart());
          router.push("/order-success");
        },
      }).open();
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     UI
  ========================== */
  return (
    <>
      <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-3 gap-8">
        {/* LEFT */}
        <div className="md:col-span-2 space-y-6">
          <Section title="Customer Details">
            {["name", "email", "phone"].map((f) => (
              <Input
                key={f}
                placeholder={f.toUpperCase()}
                value={form[f]}
                error={errors[f]}
                onChange={(v) => setForm({ ...form, [f]: v })}
              />
            ))}
          </Section>

          <Section title="Delivery Address">
            {["line1", "city", "state", "pincode"].map((f) => (
              <Input
                key={f}
                placeholder={f.toUpperCase()}
                value={form[f]}
                error={errors[f]}
                onChange={(v) => setForm({ ...form, [f]: v })}
              />
            ))}
          </Section>

          <Section title="Payment Method">
            <Radio
              checked={paymentMethod === "COD"}
              onChange={() => setPaymentMethod("COD")}
              label="Cash on Delivery"
            />
            <Radio
              checked={paymentMethod === "PREPAID"}
              onChange={() => setPaymentMethod("PREPAID")}
              label="Pay Online"
            />
          </Section>
        </div>

        {/* RIGHT */}
        <div className="border p-5 rounded bg-white h-fit">
          <h2 className="font-semibold mb-4">Order Summary</h2>

          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-600 text-sm">
              <span>Discount</span>
              <span>-₹{discount}</span>
            </div>
          )}

          <div className="flex justify-between font-semibold mt-2">
            <span>Total</span>
            <span>₹{total}</span>
          </div>

          {!coupon ? (
            <div className="mt-4 flex gap-2">
              <input
                className="border p-2 flex-1"
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
              />
              <button onClick={applyCouponHandler} className="btn-brand px-4">
                Apply
              </button>
            </div>
          ) : (
            <div className="mt-4 flex justify-between bg-green-50 p-2 rounded">
              <span>
                Coupon <b>{coupon.code}</b> applied
              </span>
              <button
                onClick={removeCouponHandler}
                className="text-red-600 text-sm"
              >
                Remove
              </button>
            </div>
          )}
          {couponError && (
            <p className="text-red-600 text-sm mt-1">{couponError}</p>
          )}

          <button
            className="btn-brand w-full mt-5 py-3"
            onClick={() => {
              if (validateForm()) setShowConfirm(true);
            }}
          >
            Place Order
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          cart={cart}
          total={total}
          paymentMethod={paymentMethod}
          coupon={appliedCoupon}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            placeOrder();
          }}
        />
      )}
    </>
  );
}

/* =========================
   HELPERS
========================= */
function Section({ title, children }) {
  return (
    <div className="bg-white border p-5 rounded">
      <h2 className="font-semibold mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Input({ value, onChange, placeholder, error }) {
  return (
    <div>
      <input
        value={value}
        placeholder={placeholder}
        className={`w-full border p-2 rounded ${error ? "border-red-500" : ""}`}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Radio({ checked, onChange, label }) {
  return (
    <label className="flex gap-2 cursor-pointer">
      <input type="radio" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

function ConfirmModal({
  cart,
  total,
  paymentMethod,
  coupon,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded p-6 w-full max-w-md">
        <h3 className="font-semibold mb-3">Confirm Order</h3>

        {cart.map((i) => (
          <div key={i.cartId} className="flex justify-between text-sm">
            <span>
              {i.name} × {i.qty}
            </span>
            <span>₹{i.price * i.qty}</span>
          </div>
        ))}

        <p className="font-semibold mt-3">Total: ₹{total}</p>
        <p>Payment: {paymentMethod}</p>
        {coupon && <p>Coupon: {coupon.code}</p>}

        <div className="flex gap-3 mt-5">
          <button className="flex-1 border py-2 rounded" onClick={onCancel}>
            Cancel
          </button>
          <button className="flex-1 btn-brand py-2" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
