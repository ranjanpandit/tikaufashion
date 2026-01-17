"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { Home, Grid3X3, ShoppingCart, User, Search } from "lucide-react";
import { useEffect, useState } from "react";
import MobileSearchModal from "@/components/common/MobileSearchModal";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // ✅ Hydration safe flag
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const cartCount = useSelector((state) =>
    (state.cart?.items || []).reduce((sum, i) => sum + (i.qty || 0), 0)
  );

  const tabs = [
    {
      type: "link",
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      type: "link",
      label: "Categories",
      href: "/categories",
      icon: Grid3X3,
      isActive:
        pathname === "/categories" ||
        pathname.startsWith("/category") ||
        pathname.startsWith("/categories/"),
    },
    {
      type: "button",
      label: "Search",
      icon: Search,
      isActive: false,
      onClick: () => setSearchOpen(true),
    },
    {
      type: "link",
      label: "Cart",
      href: "/cart",
      icon: ShoppingCart,
      isActive: pathname === "/cart" || pathname.startsWith("/checkout"),
      // ✅ badge only on client (prevents hydration mismatch)
      badge: isClient ? cartCount : 0,
    },
    {
      type: "link",
      label: "Account",
      href: "/account/profile",
      icon: User,
      isActive:
        pathname.startsWith("/account") ||
        pathname.startsWith("/orders") ||
        pathname.startsWith("/login"),
    },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[9999]">
        <div className="border-t bg-white/90 backdrop-blur">
          <div className="max-w-7xl mx-auto px-3">
            <div className="h-16 flex items-center justify-between">
              {tabs.map((t) =>
                t.type === "button" ? (
                  <TabButton key={t.label} tab={t} onClick={t.onClick} />
                ) : (
                  <TabLink key={t.href} tab={t} />
                )
              )}
            </div>
          </div>
        </div>

        {/* iPhone safe-area */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white/90" />
      </div>

      <MobileSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function TabLink({ tab }) {
  const Icon = tab.icon;

  return (
    <Link
      href={tab.href}
      className={`relative w-full flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition ${
        tab.isActive ? "text-black" : "text-gray-500"
      }`}
    >
      <div className="relative">
        <Icon size={20} />

        {/* ✅ Badge */}
        {typeof tab.badge === "number" && tab.badge > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-black text-white text-[10px] flex items-center justify-center">
            {tab.badge > 99 ? "99+" : tab.badge}
          </span>
        )}
      </div>

      <span className="text-[11px] font-medium">{tab.label}</span>

      {tab.isActive && (
        <span className="absolute -top-[2px] w-10 h-[3px] bg-black rounded-full" />
      )}
    </Link>
  );
}

function TabButton({ tab, onClick }) {
  const Icon = tab.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition text-gray-500 hover:text-black"
    >
      <Icon size={20} />
      <span className="text-[11px] font-medium">{tab.label}</span>
    </button>
  );
}
