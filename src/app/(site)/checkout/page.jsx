"use client";

import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { applyCoupon, removeCoupon, clearCart } from "@/store/cartSlice";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { items: cart, subtotal, discount, total, coupon } = useSelector(
    (state) => state.cart
  );

  /* =========================
     STATE
  ========================== */
  const [mounted, setMounted] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Customer profile (auto fill)
  const [profileLoading, setProfileLoading] = useState(true);
  const [customer, setCustomer] = useState(null);

  // Address book
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressMode, setAddressMode] = useState("SAVED"); // SAVED | NEW
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // If NEW address mode
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    line1: "",
    city: "",
    state: "",
  });

  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  /* =========================
     MOUNT
  ========================== */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* =========================
     LOAD PROFILE
  ========================== */
  async function loadProfile() {
    try {
      setProfileLoading(true);
      const res = await fetch("/api/customer/profile");

      if (res.status === 401) {
        setCustomer(null);
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setCustomer(data.customer);

        // Auto fill new-address form fields with customer
        setForm((prev) => ({
          ...prev,
          fullName: data.customer?.name || prev.fullName,
          phone: data.customer?.phone || prev.phone,
        }));
      }
    } catch (err) {
      console.log(err);
      setCustomer(null);
    } finally {
      setProfileLoading(false);
    }
  }

  /* =========================
     LOAD ADDRESSES
  ========================== */
  async function loadAddresses() {
    try {
      setAddressLoading(true);
      const res = await fetch("/api/customer/addresses");

      if (res.status === 401) {
        setAddresses([]);
        setAddressMode("NEW");
        return;
      }

      const data = await res.json();
      const list = data?.addresses || [];
      setAddresses(list);

      const def = list.find((a) => a.isDefault);
      if (def?._id) {
        setSelectedAddressId(def._id);
        setAddressMode("SAVED");
      } else if (list.length > 0) {
        setSelectedAddressId(list[0]._id);
        setAddressMode("SAVED");
      } else {
        setAddressMode("NEW");
      }
    } catch (err) {
      console.log(err);
      setAddresses([]);
      setAddressMode("NEW");
    } finally {
      setAddressLoading(false);
    }
  }

  useEffect(() => {
    if (!mounted) return;
    loadProfile();
    loadAddresses();
  }, [mounted]);

  const selectedSavedAddress = useMemo(() => {
    return addresses.find((a) => a._id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  /* =========================
     VALIDATIONS
  ========================== */
  function validateNewAddress() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Name required";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "10 digit phone required";
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "6 digit pincode required";
    if (!form.line1.trim()) e.line1 = "Address required";
    if (!form.city.trim()) e.city = "City required";
    if (!form.state.trim()) e.state = "State required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateSavedAddress() {
    if (!selectedAddressId) {
      alert("Please select an address");
      return false;
    }
    return true;
  }

  /* =========================
     COUPON
  ========================== */
  async function applyCouponHandler() {
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, subtotal }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCouponError(data?.message || "Invalid coupon");
        dispatch(removeCoupon());
        return;
      }

      dispatch(
        applyCoupon({
          code: data.code,
          type: data.type,
          value: data.value,
          maxDiscount: data.maxDiscount,
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
    setPlacing(true);

    const payload = {
      customer: {
        name: customer?.name || form.fullName,
        email: customer?.email || "",
        phone: customer?.phone || form.phone,
      },

      address:
        addressMode === "SAVED"
          ? {
              fullName: selectedSavedAddress?.fullName,
              phone: selectedSavedAddress?.phone,
              pincode: selectedSavedAddress?.pincode,
              line1: selectedSavedAddress?.address1,
              line2: selectedSavedAddress?.address2 || "",
              city: selectedSavedAddress?.city,
              state: selectedSavedAddress?.state,
              landmark: selectedSavedAddress?.landmark || "",
              type: selectedSavedAddress?.type || "home",
              addressId: selectedSavedAddress?._id,
            }
          : {
              fullName: form.fullName,
              phone: form.phone,
              pincode: form.pincode,
              line1: form.line1,
              city: form.city,
              state: form.state,
            },

      items: cart,
      subtotal,
      discount,
      coupon,
      total,
      paymentMethod,
    };

    try {
      if (paymentMethod === "COD") {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to place order");

        dispatch(clearCart());
        router.push(`/order-success?orderId=${data.orderId}`);
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed to load");

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
      console.log(err);
      alert(err.message || "Payment failed");
    } finally {
      setPlacing(false);
    }
  }

  /* =========================
     SAFE RETURNS
  ========================== */
  if (!mounted) return null;
  if (!cart.length) return <div className="p-10 text-center">Cart is empty</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-gray-600">
          Choose delivery address and payment method
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="md:col-span-2 space-y-5">
          {/* CUSTOMER CARD */}
          <Card title="Customer">
            {profileLoading ? (
              <p className="text-sm text-gray-500">Loading customer details...</p>
            ) : customer ? (
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-gray-600">{customer.email}</p>
                    <p className="text-gray-600">{customer.phone || "-"}</p>
                  </div>
                  <a
                    href="/account/profile"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Manage →
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                You are not logged in. You can still place order using new address.
              </p>
            )}
          </Card>

          {/* DELIVERY ADDRESS */}
          <Card title="Delivery Address">
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                className={`px-3 py-2 rounded-lg border text-sm ${
                  addressMode === "SAVED" ? "bg-black text-white" : "bg-white"
                }`}
                onClick={() => setAddressMode("SAVED")}
                disabled={addressLoading || addresses.length === 0}
              >
                Saved
              </button>

              <button
                type="button"
                className={`px-3 py-2 rounded-lg border text-sm ${
                  addressMode === "NEW" ? "bg-black text-white" : "bg-white"
                }`}
                onClick={() => setAddressMode("NEW")}
              >
                New
              </button>
            </div>

            {addressLoading ? (
              <p className="text-sm text-gray-500">Loading addresses...</p>
            ) : addressMode === "SAVED" ? (
              addresses.length === 0 ? (
                <div className="text-sm text-gray-600">
                  No saved address found. Please use New Address.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {addresses.map((a) => (
                    <label
                      key={a._id}
                      className={`border rounded-xl p-3 cursor-pointer transition ${
                        selectedAddressId === a._id
                          ? "border-black bg-gray-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex gap-2">
                        <input
                          type="radio"
                          checked={selectedAddressId === a._id}
                          onChange={() => setSelectedAddressId(a._id)}
                          className="mt-1"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate">
                              {a.fullName}
                            </p>
                            {a.isDefault && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                Default
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 mt-1">
                            {a.address1}
                            {a.address2 ? `, ${a.address2}` : ""}
                          </p>
                          <p className="text-xs text-gray-600">
                            {a.city}, {a.state} - {a.pincode}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Phone: {a.phone}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field
                  label="Full Name"
                  value={form.fullName}
                  error={errors.fullName}
                  onChange={(v) => setForm({ ...form, fullName: v })}
                />
                <Field
                  label="Phone"
                  value={form.phone}
                  error={errors.phone}
                  onChange={(v) => setForm({ ...form, phone: v })}
                />
                <Field
                  label="Pincode"
                  value={form.pincode}
                  error={errors.pincode}
                  onChange={(v) => setForm({ ...form, pincode: v })}
                />
                <Field
                  label="Address Line 1"
                  value={form.line1}
                  error={errors.line1}
                  onChange={(v) => setForm({ ...form, line1: v })}
                />
                <Field
                  label="City"
                  value={form.city}
                  error={errors.city}
                  onChange={(v) => setForm({ ...form, city: v })}
                />
                <Field
                  label="State"
                  value={form.state}
                  error={errors.state}
                  onChange={(v) => setForm({ ...form, state: v })}
                />
              </div>
            )}
          </Card>

          {/* PAYMENT */}
          <Card title="Payment Method">
            <div className="space-y-2">
              <PayOption
                checked={paymentMethod === "COD"}
                label="Cash on Delivery"
                desc="Pay when you receive the product"
                onChange={() => setPaymentMethod("COD")}
              />
              <PayOption
                checked={paymentMethod === "PREPAID"}
                label="Pay Online"
                desc="UPI / Cards / Netbanking via Razorpay"
                onChange={() => setPaymentMethod("PREPAID")}
              />
            </div>
          </Card>
        </div>

        {/* RIGHT: SUMMARY */}
        <div className="md:sticky md:top-4 h-fit">
          <div className="border rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm">
              <Row label="Subtotal" value={`₹${subtotal}`} />
              {discount > 0 && (
                <Row
                  label="Discount"
                  value={`-₹${discount}`}
                  className="text-green-700"
                />
              )}
              <div className="pt-2 border-t">
                <Row
                  label={<span className="font-semibold">Total</span>}
                  value={<span className="font-semibold">₹{total}</span>}
                />
              </div>
            </div>

            {/* COUPON */}
            <div className="mt-4">
              {!coupon ? (
                <div className="flex gap-2">
                  <input
                    className="border rounded-lg px-3 py-2 text-sm flex-1 outline-none"
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                  />
                  <button
                    onClick={applyCouponHandler}
                    className="px-4 py-2 rounded-lg bg-black text-white text-sm hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-green-50 border border-green-200 p-2 rounded-lg text-sm">
                  <span>
                    Coupon <b>{coupon.code}</b> applied
                  </span>
                  <button
                    onClick={removeCouponHandler}
                    className="text-red-600 text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}

              {couponError && (
                <p className="text-red-600 text-xs mt-1">{couponError}</p>
              )}
            </div>

            {/* PLACE ORDER */}
            <button
              disabled={placing}
              className="w-full mt-5 py-3 rounded-xl bg-black text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              onClick={() => {
                const ok =
                  addressMode === "SAVED"
                    ? validateSavedAddress()
                    : validateNewAddress();
                if (ok) setShowConfirm(true);
              }}
            >
              {placing ? "Placing Order..." : "Place Order"}
            </button>

            <p className="text-xs text-gray-500 mt-3">
              By placing the order, you agree to our terms and conditions.
            </p>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          cart={cart}
          total={total}
          paymentMethod={paymentMethod}
          coupon={coupon?.code}
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            placeOrder();
          }}
        />
      )}
    </div>
  );
}

/* =========================
   COMPONENTS
========================= */

function Card({ title, children }) {
  return (
    <div className="border rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, error }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <input
        className={`mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/20 ${
          error ? "border-red-500" : ""
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Row({ label, value, className = "" }) {
  return (
    <div className={`flex justify-between ${className}`}>
      <span className="text-gray-600">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PayOption({ checked, onChange, label, desc }) {
  return (
    <label
      className={`border rounded-xl p-3 cursor-pointer flex items-start gap-2 ${
        checked ? "border-black bg-gray-50" : "hover:bg-gray-50"
      }`}
    >
      <input type="radio" checked={checked} onChange={onChange} className="mt-1" />
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
      </div>
    </label>
  );
}

/* =========================
   CONFIRM MODAL (Your same)
========================= */
function ConfirmModal({
  cart,
  total,
  paymentMethod,
  coupon,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />

      <div className="relative bg-white w-full max-w-lg mx-4 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Confirm Your Order</h3>
            <p className="text-sm text-gray-500">
              Please review before placing order
            </p>
          </div>

          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.cartId}
                className="flex justify-between items-start text-sm"
              >
                <div className="pr-4">
                  <p className="font-medium leading-snug line-clamp-2">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Qty: {item.qty}
                  </p>
                </div>

                <p className="font-medium">₹{item.price * item.qty}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium">
                {paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
              </span>
            </div>

            {coupon && (
              <div className="flex justify-between text-green-600">
                <span>Coupon Applied</span>
                <span className="font-medium">{coupon}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-semibold pt-2">
              <span>Total Payable</span>
              <span>₹{total}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 py-3 rounded-lg text-sm font-medium hover:bg-white transition"
          >
            Go Back
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 bg-black text-white py-3 rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            Confirm & Place Order
          </button>
        </div>
      </div>
    </div>
  );
}
