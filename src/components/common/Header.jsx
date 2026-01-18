"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import CartIcon from "@/components/store/CartIcon";
import { User, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { useSelector } from "react-redux";

export default function Header() {
  // ✅ STORE FROM REDUX
  const storeData = useSelector((state) => state.store?.store);

  // user remains local (or later we can create authSlice)
  const [user, setUser] = useState(null);

  const [mounted, setMounted] = useState(false);
  const [portalReady, setPortalReady] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const pathname = usePathname();

  /* =========================
     INIT
  ========================== */
  useEffect(() => {
    setMounted(true);
    setPortalReady(true);

    // ✅ keep only auth fetch here
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  /* =========================
     CLOSE USER MENU OUTSIDE CLICK
  ========================== */
  useEffect(() => {
    function handleClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* =========================
     CLOSE ON ROUTE CHANGE
  ========================== */
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /* =========================
     LOCK BODY SCROLL (Drawer)
  ========================== */
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [mobileOpen]);

  /* =========================
     CLOSE ON ESC
  ========================== */
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!mounted) return null;

  const menu = storeData?.menu || [];

  const logoUrl =
    storeData?.logo ||
    storeData?.logoUrl ||
    storeData?.brandLogo ||
    storeData?.image ||
    null;

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
    window.location.href = "/";
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-16 flex items-center gap-3">
            {/* MOBILE MENU BUTTON */}
            <button
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border hover:bg-gray-50 transition"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              type="button"
            >
              <Menu size={20} />
            </button>

            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2 min-w-0">
              {logoUrl ? (
                <div className="relative w-9 h-9 rounded-xl overflow-hidden border bg-white shrink-0">
                  <Image
                    src={logoUrl}
                    alt={storeData?.name || "Store Logo"}
                    fill
                    sizes="36px"
                    className="object-cover"
                    priority
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl border bg-gray-50 flex items-center justify-center font-bold text-sm shrink-0">
                  {storeData?.name?.slice(0, 1) || "T"}
                </div>
              )}

              <div className="min-w-0">
                <p className="font-bold text-base truncate">
                  {storeData?.name || "TikauFashion"}
                </p>
                <p className="text-[11px] text-gray-500 truncate hidden sm:block">
                  Premium Fashion Store
                </p>
              </div>
            </Link>

            {/* DESKTOP NAV */}
            <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
              {menu.map((item, i) => {
                const href = item.slug || "#";
                const active = pathname === href;

                return (
                  <Link
                    key={i}
                    href={href}
                    className={`text-sm font-medium transition ${
                      active ? "text-black" : "text-gray-700 hover:text-black"
                    }`}
                  >
                    <span className="relative">
                      {item.label}
                      {active && (
                        <span className="absolute left-0 -bottom-2 w-full h-[2px] bg-black rounded-full" />
                      )}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* RIGHT */}
            <div className="ml-auto flex items-center gap-2">
              <CartIcon />

              {!user ? (
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl border hover:bg-gray-50 transition"
                  aria-label="Login"
                >
                  <User size={18} />
                </Link>
              ) : (
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((p) => !p)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border hover:bg-gray-50 transition"
                    type="button"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-xs font-bold">
                      {user?.name?.slice(0, 1)?.toUpperCase() || "U"}
                    </div>
                    <p className="text-sm font-semibold max-w-[140px] truncate">
                      {user?.name?.split(" ")?.[0] || "User"}
                    </p>
                    <ChevronDown size={16} className="text-gray-500" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border rounded-2xl shadow-xl overflow-hidden">
                      <div className="px-4 py-3 border-b bg-gray-50">
                        <p className="text-sm font-semibold truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {user?.email}
                        </p>
                      </div>

                      <div className="py-1">
                        <Link
                          href="/account/profile"
                          className="block px-4 py-3 text-sm hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Profile & Addresses
                        </Link>

                        <Link
                          href="/orders"
                          className="block px-4 py-3 text-sm hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                      </div>

                      <div className="border-t">
                        <button
                          onClick={logout}
                          className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                          type="button"
                        >
                          <LogOut size={14} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ✅ MOBILE DRAWER VIA PORTAL */}
      {portalReady && mobileOpen
        ? createPortal(
            <MobileDrawer
              store={storeData}
              user={user}
              menu={menu}
              pathname={pathname}
              onClose={() => setMobileOpen(false)}
              onLogout={logout}
            />,
            document.body
          )
        : null}
    </>
  );
}

/* =========================
   MOBILE DRAWER
========================= */
function MobileDrawer({ store, user, menu, pathname, onClose, onLogout }) {
  const logoUrl =
    store?.logo || store?.logoUrl || store?.brandLogo || store?.image || null;

  return (
    <div className="fixed inset-0 z-[99999]">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl">
        <div className="p-5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {logoUrl ? (
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border bg-white shrink-0">
                <Image
                  src={logoUrl}
                  alt={store?.name || "Store Logo"}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl border bg-gray-50 flex items-center justify-center font-bold text-sm shrink-0">
                {store?.name?.slice(0, 1) || "T"}
              </div>
            )}

            <div className="min-w-0">
              <p className="font-bold truncate">{store?.name || "Menu"}</p>
              <p className="text-xs text-gray-500 truncate">Browse</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border hover:bg-gray-50 transition"
            aria-label="Close menu"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto h-[calc(100%-80px)]">
          {!user ? (
            <div className="border rounded-2xl p-4 bg-gray-50">
              <p className="font-semibold text-sm">Welcome</p>
              <p className="text-xs text-gray-600 mt-1">
                Login to manage profile, addresses & orders.
              </p>

              <Link
                href="/login"
                onClick={onClose}
                className="inline-block mt-4 w-full text-center py-3 rounded-xl bg-black text-white text-sm font-semibold hover:opacity-90"
              >
                Login / Signup
              </Link>
            </div>
          ) : (
            <div className="border rounded-2xl p-4 bg-gray-50">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <Link
                  href="/account/profile"
                  onClick={onClose}
                  className="text-center py-2 rounded-xl border text-sm font-medium hover:bg-gray-100"
                >
                  Profile
                </Link>
                <Link
                  href="/orders"
                  onClick={onClose}
                  className="text-center py-2 rounded-xl border text-sm font-medium hover:bg-gray-100"
                >
                  Orders
                </Link>
              </div>

              <button
                onClick={onLogout}
                className="mt-3 w-full py-3 rounded-xl border text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                type="button"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs font-semibold text-gray-500 mb-2">Menu</p>

            <nav className="space-y-2">
              {menu.map((item, i) => {
                const href = item.slug || "#";
                const active = pathname === href;

                return (
                  <Link
                    key={i}
                    href={href}
                    onClick={onClose}
                    className={`block px-4 py-3 rounded-2xl border text-sm font-medium transition ${
                      active
                        ? "bg-black text-white border-black"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
