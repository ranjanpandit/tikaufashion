"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminSidebar() {
  const path = usePathname();
  const router = useRouter();

  const [store, setStore] = useState(null);

  const menu = [
    { name: "Dashboard", href: "/admin/dashboard" },
    { name: "Products", href: "/admin/products" },
    { name: "Orders", href: "/admin/orders" },
    { name: "Coupons", href: "/admin/coupons" },
    { name: "Categories", href: "/admin/categories" },
    { name: "Filters", href: "/admin/filters" },
    { name: "Store", href: "/admin/store" },
  ];

  useEffect(() => {
    fetch("/api/admin/store")
      .then((res) => res.json())
      .then(setStore);
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="w-64 bg-black text-white p-6 flex flex-col">
      {/* LOGO / BRAND */}
      <div className="mb-6 flex items-center gap-2">
        {store?.logo ? (
          <img
            src={store.logo}
            alt={store.name || "Store Logo"}
            className="h-10 w-auto object-contain"
          />
        ) : (
          <h2 className="text-xl font-bold">
            {store?.name || "TikauFashion"} Admin
          </h2>
        )}
      </div>

      {/* MENU */}
      <nav className="space-y-3 flex-1">
        {menu.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`block px-3 py-2 rounded ${
              path === m.href
                ? "bg-white text-black"
                : "hover:bg-gray-800"
            }`}
          >
            {m.name}
          </Link>
        ))}
      </nav>

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="mt-6 text-left px-3 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </aside>
  );
}
