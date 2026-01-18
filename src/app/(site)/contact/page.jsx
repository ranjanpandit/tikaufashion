"use client";

import { useState } from "react";
import { useSelector } from "react-redux";

export default function ContactPage() {
  const store = useSelector((state) => state.store?.store);
  const brandName = store?.name || "TikauFashion";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    setErrorMsg("");
    if (!form.name.trim()) return "Name is required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Valid email is required";
    if (form.phone && !/^\d{10}$/.test(form.phone))
      return "Phone must be 10 digits";
    if (!form.subject.trim()) return "Subject is required";
    if (!form.message.trim()) return "Message is required";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.message || "Failed to submit. Please try again.");
        return;
      }

      setSuccessMsg("Thanks! Your message has been submitted.");
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setErrorMsg("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Contact Us</h1>
        <p className="text-sm text-gray-600 mt-2">
          Have a question about your order or need help? Reach out to{" "}
          <span className="font-semibold">{brandName}</span>.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* LEFT: FORM */}
        <div className="lg:col-span-7">
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Send us a message</h2>
            <p className="text-sm text-gray-600 mt-1">
              Fill in the details and our team will respond soon.
            </p>

            {/* ALERTS */}
            {errorMsg && (
              <div className="mt-4 text-sm border border-red-200 bg-red-50 text-red-700 px-4 py-3 rounded-xl">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mt-4 text-sm border border-green-200 bg-green-50 text-green-700 px-4 py-3 rounded-xl">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Full Name"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(v) => updateField("name", v)}
                />

                <Field
                  label="Email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(v) => updateField("email", v)}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field
                  label="Phone (Optional)"
                  placeholder="10 digit phone"
                  value={form.phone}
                  onChange={(v) => updateField("phone", v)}
                />

                <Field
                  label="Subject"
                  placeholder="Order / Delivery / Return"
                  value={form.subject}
                  onChange={(v) => updateField("subject", v)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700">
                  Message
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Write your message..."
                  rows={5}
                  className="mt-1 w-full border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-black text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Message"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT: SUPPORT INFO */}
        <div className="lg:col-span-5 space-y-4">
          <InfoCard
            title="Customer Support"
            desc="We usually reply within 24 hours."
            items={[
              { label: "Email", value: "support@tikaufashion.com" },
              { label: "Phone", value: "+91 99999 99999" },
              { label: "Working Hours", value: "Mon - Sat (10AM - 7PM)" },
            ]}
          />

          <InfoCard
            title="Order Help"
            desc="For faster support, keep your Order ID ready."
            items={[
              { label: "Track Orders", value: "My Orders →", href: "/orders" },
              {
                label: "Profile",
                value: "Profile & Addresses →",
                href: "/account/profile",
              },
            ]}
          />

          <div className="border rounded-2xl bg-gray-50 p-6">
            <h3 className="font-semibold">Why shop with {brandName}?</h3>
            <ul className="mt-3 text-sm text-gray-700 space-y-2">
              <li>✅ Premium quality products</li>
              <li>✅ Secure online payments</li>
              <li>✅ Easy return policy</li>
              <li>✅ Fast delivery across India</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   SMALL UI PARTS
========================= */

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
      />
    </div>
  );
}

function InfoCard({ title, desc, items = [] }) {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      {desc && <p className="text-sm text-gray-600 mt-1">{desc}</p>}

      <div className="mt-4 space-y-3 text-sm">
        {items.map((it, idx) => (
          <div key={idx} className="flex justify-between gap-4">
            <span className="text-gray-600">{it.label}</span>

            {it.href ? (
              <a
                href={it.href}
                className="font-semibold text-black hover:underline"
              >
                {it.value}
              </a>
            ) : (
              <span className="font-semibold text-gray-900">{it.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
