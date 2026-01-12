"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import CartIcon from "@/components/store/CartIcon";
import { User, Menu, X, LogOut } from "lucide-react";

export default function Header() {
  const [store, setStore] = useState(null);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const pathname = usePathname();

  /* =========================
     LOAD STORE + USER
  ========================== */
  useEffect(() => {
    setMounted(true);

    fetch("/api/store")
      .then((r) => r.json())
      .then(setStore)
      .catch(() => setStore(null));

    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  /* =========================
     CLOSE USER MENU ON OUTSIDE CLICK
  ========================== */
  useEffect(() => {
    function handleClick(e) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!mounted) return null;

  /* =========================
     LOGOUT
  ========================== */
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center relative">
        {/* LOGO */}
        <Link
          href="/"
          className="font-bold text-xl tracking-wide text-brand"
        >
          {store?.name || "TikauFashion"}
        </Link>

        {/* =========================
            DESKTOP MENU
        ========================== */}
        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 gap-10">
          {(store?.menu || []).map((item, i) => {
            const isActive = pathname === item.slug;

            return (
              <Link
                key={i}
                href={item.slug || "#"}
                className={`
                  relative text-sm font-medium transition-all duration-300
                  ${
                    isActive
                      ? "text-brand after:w-full"
                      : "text-gray-700 hover:text-brand after:w-0"
                  }
                  after:absolute after:left-0 after:-bottom-1
                  after:h-[2px] after:bg-brand
                  after:transition-all after:duration-300
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* =========================
            RIGHT ACTIONS
        ========================== */}
        <div className="ml-auto flex items-center gap-5 relative">
          <CartIcon />

          {/* AUTH */}
          {!user ? (
            <Link
              href="/login"
              className="text-gray-700 hover:text-brand transition"
            >
              <User size={20} />
            </Link>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
                className="text-sm font-medium text-gray-700 hover:text-brand transition"
              >
                Hi, {user.name.split(" ")[0]} ▾
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border rounded-lg shadow-lg overflow-hidden">
                  <Link
                    href="/orders"
                    className="block px-4 py-3 text-sm hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    My Orders
                  </Link>

                  <button
                    onClick={logout}
                    className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* =========================
         MOBILE DRAWER
      ========================== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-80 bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-lg">
                {store?.name || "Menu"}
              </span>
              <button onClick={() => setMobileOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <nav className="space-y-3">
              {(store?.menu || []).map((item, i) => (
                <Link
                  key={i}
                  href={item.slug || "#"}
                  className="block text-base font-medium py-2 px-2 rounded hover:bg-gray-100 hover:text-brand transition"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* MOBILE AUTH */}
            <div className="mt-8 border-t pt-6 space-y-4">
              {!user ? (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                >
                  Login
                </Link>
              ) : (
                <>
                  <Link
                    href="/orders"
                    className="block"
                    onClick={() => setMobileOpen(false)}
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={logout}
                    className="text-red-600"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
