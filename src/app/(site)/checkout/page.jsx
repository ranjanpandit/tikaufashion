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

  // Customer profile
  const [profileLoading, setProfileLoading] = useState(true);
  const [customer, setCustomer] = useState(null);

  // Address book
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);

  const [addressMode, setAddressMode] = useState("SAVED"); // SAVED | NEW
  const [selectedAddressId, setSelectedAddressId] = useState("");

  // ✅ enterprise UX: show only selected by default
  const [showAllAddresses, setShowAllAddresses] = useState(false);

  // ✅ inside SAVED mode: allow add new without switching tab confusion
  const [showNewAddressInline, setShowNewAddressInline] = useState(false);

  // New address form
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    line1: "",
    city: "",
    state: "",
  });

  // ✅ Optional inline edit support
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  // Right-side UI helpers
  const [showItems, setShowItems] = useState(false);

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
    return (
      addresses.find((a) => a._id === selectedAddressId) ||
      addresses.find((a) => a.isDefault) ||
      null
    );
  }, [addresses, selectedAddressId]);

  const canPlaceOrder = useMemo(() => {
    if (!cart.length) return false;

    // ✅ if SAVED mode and not using inline-new
    if (addressMode === "SAVED" && !showNewAddressInline)
      return !!selectedAddressId;

    // ✅ inline NEW address OR NEW tab
    return (
      form.fullName.trim() &&
      /^\d{10}$/.test(form.phone) &&
      /^\d{6}$/.test(form.pincode) &&
      form.line1.trim() &&
      form.city.trim() &&
      form.state.trim()
    );
  }, [
    cart.length,
    addressMode,
    selectedAddressId,
    showNewAddressInline,
    form,
  ]);

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
     SAVED ADDRESS: DELETE (optional)
  ========================== */
  async function deleteAddress(id) {
    const ok = confirm("Delete this address?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/customer/addresses/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Failed to delete address");
        return;
      }

      // refresh list
      await loadAddresses();
      setShowAllAddresses(false);
    } catch (e) {
      alert("Failed to delete address");
    }
  }

  /* =========================
     SAVED ADDRESS: EDIT (optional)
  ========================== */
  function startEditAddress(address) {
    setEditingAddressId(address._id);
    setEditForm({
      fullName: address.fullName || "",
      phone: address.phone || "",
      pincode: address.pincode || "",
      address1: address.address1 || "",
      address2: address.address2 || "",
      city: address.city || "",
      state: address.state || "",
      landmark: address.landmark || "",
      type: address.type || "home",
    });
  }

  function cancelEditAddress() {
    setEditingAddressId(null);
    setEditForm(null);
  }

  async function saveEditAddress() {
    if (!editingAddressId || !editForm) return;

    try {
      const res = await fetch(`/api/customer/addresses/${editingAddressId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Failed to update address");
        return;
      }

      await loadAddresses();
      cancelEditAddress();
    } catch (e) {
      alert("Failed to update address");
    }
  }

  /* =========================
     NEW ADDRESS: SAVE (optional)
  ========================== */
  async function saveNewAddressToAccount() {
    const ok = validateNewAddress();
    if (!ok) return;

    try {
      const res = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          pincode: form.pincode,
          address1: form.line1,
          address2: "",
          city: form.city,
          state: form.state,
          type: "home",
          isDefault: addresses.length === 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.message || "Failed to save address");
        return;
      }

      await loadAddresses();
      setShowNewAddressInline(false);
      setAddressMode("SAVED");
      setShowAllAddresses(false);
      alert("Address saved ✅");
    } catch (e) {
      alert("Failed to save address");
    }
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
     PLACE ORDER (secure)
  ========================== */
  async function placeOrder() {
    setPlacing(true);

    const shippingAddress =
      addressMode === "SAVED" && !showNewAddressInline
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
            addressId: selectedSavedAddress?._id || null,
          }
        : {
            fullName: form.fullName,
            phone: form.phone,
            pincode: form.pincode,
            line1: form.line1,
            line2: "",
            city: form.city,
            state: form.state,
            landmark: "",
            type: "home",
            addressId: null,
          };

    const payload = {
      customer: {
        name: shippingAddress.fullName || customer?.name || "",
        email: customer?.email || "",
        phone: shippingAddress.phone || customer?.phone || "",
      },
      shippingAddress,
      items: cart,
      subtotal,
      discount,
      coupon,
      total,
      paymentMethod,
    };

    try {
      // ✅ COD
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

      // ✅ PREPAID (Secure)
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error("Razorpay failed to load");

      const initRes = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: payload.customer,
          shippingAddress: payload.shippingAddress,
          items: payload.items,
          coupon: payload.coupon,
          discount: payload.discount,
        }),
      });

      const initData = await initRes.json();

      if (!initRes.ok) {
        throw new Error(initData?.message || "Failed to start online payment");
      }

      const dbOrderId = initData.orderId;
      const rpOrder = initData.razorpay;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rpOrder.amount,
        currency: rpOrder.currency || "INR",
        name: "TikauFashion",
        description: "Secure Online Payment",
        order_id: rpOrder.id,

        prefill: {
          name: initData.customer?.name || payload.customer.name,
          email: initData.customer?.email || payload.customer.email,
          contact: initData.customer?.phone || payload.customer.phone,
        },

        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: dbOrderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok) {
              alert(verifyData?.message || "Payment verification failed");
              return;
            }

            dispatch(clearCart());
            router.push(`/order-success?orderId=${dbOrderId}`);
          } catch (err) {
            console.log(err);
            alert("Payment succeeded but verification failed. Contact support.");
          }
        },

        modal: {
          ondismiss: () => alert("Payment cancelled"),
        },

        theme: { color: "#000000" },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.log(err);
      alert(err?.message || "Payment failed");
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
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="text-sm text-gray-600">
            Delivery details & payment selection
          </p>
        </div>

        <div className="text-xs text-gray-500">
          Items: <b>{cart.length}</b>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-3 space-y-5">
          {/* CUSTOMER */}
          <Card title="Customer">
            {profileLoading ? (
              <p className="text-sm text-gray-500">Loading customer details...</p>
            ) : customer ? (
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm">
                  <p className="font-semibold">{customer.name}</p>
                  <p className="text-gray-600">{customer.email}</p>
                  <p className="text-gray-600">{customer.phone || "-"}</p>
                </div>

                <a
                  href="/account/profile"
                  className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                >
                  Manage →
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Guest checkout enabled. Please add address details.
              </p>
            )}
          </Card>

          {/* DELIVERY ADDRESS */}
          <Card
            title="Delivery Address"
            right={
              <div className="flex gap-2">
                <TabBtn
                  active={addressMode === "SAVED"}
                  disabled={addressLoading || addresses.length === 0}
                  onClick={() => {
                    setAddressMode("SAVED");
                    setShowNewAddressInline(false);
                  }}
                >
                  Saved
                </TabBtn>

                <TabBtn
                  active={addressMode === "NEW"}
                  onClick={() => {
                    setAddressMode("NEW");
                    setShowAllAddresses(false);
                    setShowNewAddressInline(false);
                  }}
                >
                  New
                </TabBtn>
              </div>
            }
          >
            {addressLoading ? (
              <p className="text-sm text-gray-500">Loading addresses...</p>
            ) : addressMode === "SAVED" ? (
              addresses.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No saved address found. Please use New Address.
                </p>
              ) : (
                <div className="space-y-3">
                  {/* ✅ Default view - only selected address */}
                  {!showAllAddresses ? (
                    <div className="border rounded-2xl p-4 bg-gray-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">
                            {selectedSavedAddress?.fullName}
                          </p>

                          <p className="text-xs text-gray-600 mt-1">
                            {selectedSavedAddress?.address1}
                            {selectedSavedAddress?.address2
                              ? `, ${selectedSavedAddress.address2}`
                              : ""}
                            , {selectedSavedAddress?.city},{" "}
                            {selectedSavedAddress?.state} -{" "}
                            {selectedSavedAddress?.pincode}
                          </p>

                          <p className="text-xs text-gray-600 mt-1">
                            Phone: {selectedSavedAddress?.phone}
                          </p>

                          {selectedSavedAddress?.isDefault && (
                            <span className="inline-flex mt-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                              Default Address
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowAllAddresses(true)}
                            className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                          >
                            Change
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowNewAddressInline(true)}
                            className="text-sm text-gray-700 hover:underline whitespace-nowrap"
                          >
                            + Add New
                          </button>
                        </div>
                      </div>

                      {/* ✅ Inline NEW Address */}
                      {showNewAddressInline && (
                        <div className="mt-4 border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-semibold">
                              Add New Address
                            </p>
                            <button
                              type="button"
                              className="text-sm text-gray-600 hover:underline"
                              onClick={() => setShowNewAddressInline(false)}
                            >
                              Cancel
                            </button>
                          </div>

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
                              onChange={(v) =>
                                setForm({ ...form, pincode: v })
                              }
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

                          <div className="flex gap-2 mt-4">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-gray-50"
                              onClick={() => setShowNewAddressInline(false)}
                            >
                              Close
                            </button>

                            <button
                              type="button"
                              className="px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90"
                              onClick={saveNewAddressToAccount}
                            >
                              Save Address
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* ✅ Expanded view */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">
                          Select Address
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setShowAllAddresses(false);
                            cancelEditAddress();
                          }}
                          className="text-sm text-gray-600 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="space-y-3">
                        {addresses.map((a) => (
                          <div
                            key={a._id}
                            className={`border rounded-2xl p-3 transition ${
                              selectedAddressId === a._id
                                ? "border-black bg-gray-50"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {/* ✅ If editing this address */}
                            {editingAddressId === a._id && editForm ? (
                              <div className="space-y-3">
                                <div className="grid sm:grid-cols-2 gap-3">
                                  <MiniField
                                    label="Full Name"
                                    value={editForm.fullName}
                                    onChange={(v) =>
                                      setEditForm({ ...editForm, fullName: v })
                                    }
                                  />
                                  <MiniField
                                    label="Phone"
                                    value={editForm.phone}
                                    onChange={(v) =>
                                      setEditForm({ ...editForm, phone: v })
                                    }
                                  />
                                  <MiniField
                                    label="Pincode"
                                    value={editForm.pincode}
                                    onChange={(v) =>
                                      setEditForm({ ...editForm, pincode: v })
                                    }
                                  />
                                  <MiniField
                                    label="City"
                                    value={editForm.city}
                                    onChange={(v) =>
                                      setEditForm({ ...editForm, city: v })
                                    }
                                  />
                                  <MiniField
                                    label="State"
                                    value={editForm.state}
                                    onChange={(v) =>
                                      setEditForm({ ...editForm, state: v })
                                    }
                                  />
                                  <MiniField
                                    label="Type"
                                    value={editForm.type}
                                    onChange={(v) =>
                                      setEditForm({ ...editForm, type: v })
                                    }
                                  />
                                </div>

                                <MiniField
                                  label="Address Line 1"
                                  value={editForm.address1}
                                  onChange={(v) =>
                                    setEditForm({ ...editForm, address1: v })
                                  }
                                />
                                <MiniField
                                  label="Address Line 2"
                                  value={editForm.address2}
                                  onChange={(v) =>
                                    setEditForm({ ...editForm, address2: v })
                                  }
                                />

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    className="px-3 py-2 rounded-xl border text-sm font-semibold hover:bg-gray-50"
                                    onClick={cancelEditAddress}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="px-3 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90"
                                    onClick={saveEditAddress}
                                  >
                                    Save Changes
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex gap-3 cursor-pointer">
                                <input
                                  type="radio"
                                  checked={selectedAddressId === a._id}
                                  onChange={() => {
                                    setSelectedAddressId(a._id);
                                    setShowAllAddresses(false);
                                    cancelEditAddress();
                                  }}
                                  className="mt-1"
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm truncate">
                                      {a.fullName}
                                    </p>
                                    {a.isDefault && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                        Default
                                      </span>
                                    )}
                                    <span className="text-[11px] text-gray-500 ml-auto">
                                      {a.type || "home"}
                                    </span>
                                  </div>

                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {a.address1}
                                    {a.address2 ? `, ${a.address2}` : ""},{" "}
                                    {a.city}, {a.state} - {a.pincode}
                                  </p>

                                  <p className="text-xs text-gray-600 mt-1">
                                    Phone: {a.phone}
                                  </p>

                                  {/* ✅ Actions */}
                                  <div className="flex gap-4 mt-2 text-xs">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        startEditAddress(a);
                                      }}
                                      className="text-blue-600 hover:underline"
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        deleteAddress(a._id);
                                      }}
                                      className="text-red-600 hover:underline"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              </label>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
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

          {/* ✅ PAYMENT METHOD */}
          <Card title="Payment Method">
            <div className="grid sm:grid-cols-2 gap-3">
              <PayCard
                checked={paymentMethod === "COD"}
                title="Cash on Delivery"
                desc="Pay when you receive the product"
                onChange={() => setPaymentMethod("COD")}
                badge="Popular"
              />
              <PayCard
                checked={paymentMethod === "PREPAID"}
                title="Pay Online"
                desc="UPI / Cards / Netbanking via Razorpay"
                onChange={() => setPaymentMethod("PREPAID")}
                badge="Secure"
              />
            </div>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2 lg:sticky lg:top-4 h-fit space-y-4">
          <div className="border rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Order Summary</h2>
              <button
                type="button"
                onClick={() => setShowItems((p) => !p)}
                className="text-sm text-blue-600 hover:underline"
              >
                {showItems ? "Hide Items" : "Show Items"}
              </button>
            </div>

            {showItems && (
              <div className="mt-4 max-h-[220px] overflow-y-auto pr-1 space-y-3 border rounded-xl p-3 bg-gray-50">
                {cart.map((item) => (
                  <div key={item.cartId} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg border object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">
                        {item.name}
                      </p>

                      {item.selectedOptions &&
                        Object.keys(item.selectedOptions).length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {Object.entries(item.selectedOptions)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" | ")}
                          </p>
                        )}

                      <p className="text-xs text-gray-600 mt-1">
                        ₹{item.price} × {item.qty} ={" "}
                        <b className="text-gray-900">₹{item.price * item.qty}</b>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 text-sm mt-4">
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

              <div className="pt-2">
                <Row
                  label="Payment"
                  value={
                    <span className="text-xs px-2 py-1 rounded-full border bg-gray-50">
                      {paymentMethod === "COD" ? "COD" : "ONLINE"}
                    </span>
                  }
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

            <button
              disabled={placing || !canPlaceOrder}
              className="w-full mt-5 py-3 rounded-xl bg-black text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              onClick={() => {
                const ok =
                  addressMode === "SAVED" && !showNewAddressInline
                    ? validateSavedAddress()
                    : validateNewAddress();

                if (ok) setShowConfirm(true);
              }}
            >
              {placing
                ? "Processing..."
                : paymentMethod === "COD"
                ? "Place COD Order"
                : "Pay Securely"}
            </button>

            {!canPlaceOrder && (
              <p className="text-xs text-red-600 mt-2">
                Please complete delivery address details to continue.
              </p>
            )}

            <p className="text-xs text-gray-500 mt-3">
              By placing the order, you agree to our terms & policies.
            </p>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          cart={cart}
          subtotal={subtotal}
          discount={discount}
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

function Card({ title, right, children }) {
  return (
    <div className="border rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="font-semibold">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function TabBtn({ active, disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg border text-sm transition ${
        active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50"
      } disabled:opacity-50`}
    >
      {children}
    </button>
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

function MiniField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-gray-600">{label}</label>
      <input
        className="mt-1 w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
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

function PayCard({ checked, onChange, title, desc, badge }) {
  return (
    <label
      className={`border rounded-2xl p-4 cursor-pointer transition ${
        checked ? "border-black bg-gray-50" : "hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <input
          type="radio"
          checked={checked}
          onChange={onChange}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{title}</p>
            {badge && (
              <span className="text-[11px] px-2 py-0.5 rounded-full border bg-white text-gray-700">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-1">{desc}</p>
        </div>
      </div>
    </label>
  );
}

/* =========================
   Confirm Modal (same)
========================= */

function ConfirmModal({
  cart,
  subtotal,
  discount,
  total,
  paymentMethod,
  coupon,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onCancel?.();
    }

    window.addEventListener("keydown", onKeyDown);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/55" onClick={onCancel} />

      <div className="relative bg-white w-full md:max-w-2xl md:mx-4 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden">
        <div className="px-5 md:px-6 py-4 border-b bg-white flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900">
              Confirm Your Order
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Please review items & payment before placing the order.
            </p>
          </div>

          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-xl border hover:bg-gray-50 text-gray-600 flex items-center justify-center"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid md:grid-cols-5">
          <div className="md:col-span-3 px-5 md:px-6 py-4 max-h-[55vh] md:max-h-[60vh] overflow-y-auto">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Items ({cart.length})
            </p>

            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.cartId}
                  className="border rounded-2xl p-3 flex gap-3 bg-white"
                >
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl border object-cover shrink-0"
                  />
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
          </div>

          <div className="md:col-span-2 border-t md:border-t-0 md:border-l bg-gray-50 px-5 md:px-6 py-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">
              Order Summary
            </p>

            <div className="space-y-2 text-sm">
              <SummaryRow label="Payment Method">
                <span className="font-medium">
                  {paymentMethod === "COD"
                    ? "Cash on Delivery"
                    : "Online Payment"}
                </span>
              </SummaryRow>

              {coupon && (
                <SummaryRow label="Coupon Applied">
                  <span className="text-green-700 font-semibold">{coupon}</span>
                </SummaryRow>
              )}

              <div className="border-t my-3" />

              <SummaryRow label="Subtotal">
                <span className="font-medium">₹{subtotal}</span>
              </SummaryRow>

              {discount > 0 && (
                <SummaryRow label="Discount">
                  <span className="font-medium text-green-700">
                    -₹{discount}
                  </span>
                </SummaryRow>
              )}

              <div className="border-t pt-3 mt-3 flex items-center justify-between">
                <span className="font-bold text-base">Total Payable</span>
                <span className="font-extrabold text-lg">₹{total}</span>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                By placing the order you agree to our terms & policies.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 md:px-6 py-4 border-t bg-white flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-300 py-3 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition"
          >
            Edit Order
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 bg-black text-white py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition"
          >
            Confirm & Place Order
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-gray-600 text-sm">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}
