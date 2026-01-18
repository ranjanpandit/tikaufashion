"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";

export default function Footer() {
  const store = useSelector((state) => state.store?.store);

  const brandName = store?.name || "TikauFashion";
  const year = new Date().getFullYear();

  // ✅ Static Pages (dynamic from admin)
  const [footerPages, setFooterPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);

  // ✅ Newsletter state
  const [email, setEmail] = useState("");
  const [subLoading, setSubLoading] = useState(false);
  const [subMsg, setSubMsg] = useState("");
  const [subErr, setSubErr] = useState("");

  useEffect(() => {
    async function loadFooterPages() {
      try {
        setPagesLoading(true);
        const res = await fetch("/api/pages/footer", { cache: "no-store" });
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          setFooterPages(data);
        } else {
          setFooterPages([]);
        }
      } catch (e) {
        setFooterPages([]);
      } finally {
        setPagesLoading(false);
      }
    }

    loadFooterPages();
  }, []);

  async function subscribe() {
    setSubMsg("");
    setSubErr("");

    const clean = email.trim().toLowerCase();
    if (!clean || !/^\S+@\S+\.\S+$/.test(clean)) {
      setSubErr("Please enter a valid email address");
      return;
    }

    try {
      setSubLoading(true);

      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, source: "footer" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubErr(data?.message || "Subscription failed");
        return;
      }

      setSubMsg(data?.message || "Subscribed successfully ✅");
      setEmail("");
    } catch (err) {
      setSubErr("Subscription failed. Please try again.");
    } finally {
      setSubLoading(false);
    }
  }

  return (
    <footer className="mt-16 border-t bg-white">
      {/* TOP SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* BRAND / ABOUT */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl border bg-gray-50 flex items-center justify-center font-bold">
                {brandName?.slice(0, 1) || "T"}
              </div>

              <div className="min-w-0">
                <p className="text-lg font-bold truncate">{brandName}</p>
                <p className="text-xs text-gray-500 truncate">
                  Premium fashion store
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-4 leading-relaxed">
              Premium fashion for everyday style. Handpicked collections,
              trusted quality, and smooth delivery experience.
            </p>

            {/* TRUST BADGES */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-gray-700">
              <TrustChip icon="🚚" text="Fast Delivery" />
              <TrustChip icon="🔒" text="Secure Payments" />
              <TrustChip icon="🔄" text="Easy Returns" />
              <TrustChip icon="💯" text="Quality Checked" />
            </div>
          </div>

          {/* SHOP */}
          <div className="lg:col-span-2">
            <FooterTitle>Shop</FooterTitle>
            <ul className="space-y-3 text-sm text-gray-600">
              <FooterLink href="/">New Arrivals</FooterLink>
              <FooterLink href="/">Best Sellers</FooterLink>
              <FooterLink href="/">Featured</FooterLink>
              <FooterLink href="/">Offers</FooterLink>
            </ul>
          </div>

          {/* CUSTOMER */}
          <div className="lg:col-span-3">
            <FooterTitle>Customer</FooterTitle>
            <ul className="space-y-3 text-sm text-gray-600">
              <FooterLink href="/orders">My Orders</FooterLink>
              <FooterLink href="/account/profile">Profile</FooterLink>
              <FooterLink href="/faq">FAQs</FooterLink>
              <FooterLink href="/contact">Contact Us</FooterLink>
            </ul>
          </div>

          {/* ✅ PAGES (Dynamic) */}
          <div className="lg:col-span-3">
            <FooterTitle>Important Links</FooterTitle>

            {pagesLoading ? (
              <p className="text-sm text-gray-500">Loading pages...</p>
            ) : footerPages.length === 0 ? (
              <p className="text-sm text-gray-500">
                No pages added from admin.
              </p>
            ) : (
              <ul className="space-y-3 text-sm text-gray-600">
                {footerPages.map((p) => (
                  <li key={p._id}>
                    <Link
                      className="hover:text-black transition"
                      href={`/page/${p.slug}`}
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ✅ Newsletter (full width) */}
        <div className="mt-10 bg-gray-50 border rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-base font-semibold">Stay Updated</p>
            <p className="text-sm text-gray-600">
              Get updates on new launches and exclusive deals.
            </p>
          </div>

          <div className="w-full md:max-w-md">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black/10"
              />

              <button
                type="button"
                onClick={subscribe}
                disabled={subLoading}
                className="px-4 py-3 rounded-2xl bg-black text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {subLoading ? "Joining..." : "Join"}
              </button>
            </div>

            {subErr && <p className="text-xs text-red-600 mt-2">{subErr}</p>}
            {subMsg && <p className="text-xs text-green-700 mt-2">{subMsg}</p>}

            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
              By subscribing, you agree to receive marketing updates. You can
              unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <p className="text-xs text-gray-500">
            © {year} {brandName}. All rights reserved.
          </p>

          {/* ✅ bottom mini links */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            {footerPages?.slice(0, 3).map((p) => (
              <Link
                key={p._id}
                className="hover:text-black transition"
                href={`/page/${p.slug}`}
              >
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* =========================
   SMALL UI PARTS
========================= */

function FooterTitle({ children }) {
  return (
    <h4 className="text-sm font-semibold text-gray-900 mb-4">{children}</h4>
  );
}

function FooterLink({ href, children }) {
  return (
    <li>
      <Link href={href} className="hover:text-black transition">
        {children}
      </Link>
    </li>
  );
}

function TrustChip({ icon, text }) {
  return (
    <div className="border rounded-2xl bg-gray-50 px-3 py-2 flex items-center gap-2">
      <span className="text-sm">{icon}</span>
      <span className="font-medium">{text}</span>
    </div>
  );
}
