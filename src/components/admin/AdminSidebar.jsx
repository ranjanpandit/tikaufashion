"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminSidebar() {
  const path = usePathname();
  const router = useRouter();

  const [store, setStore] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch store branding + admin permissions
  useEffect(() => {
    async function load() {
      try {
        const [storeRes, adminRes] = await Promise.all([
          fetch("/api/admin/store", { cache: "no-store" }),
          fetch("/api/admin/me", { cache: "no-store" }),
        ]);

        const storeJson = await storeRes.json();
        const adminJson = await adminRes.json();

        if (storeRes.ok) setStore(storeJson);
        if (adminRes.ok) setAdmin(adminJson);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const can = (permKey) => {
    if (!admin) return false;
    if (admin.role === "super_admin") return true;
    return !!admin.permissions?.[permKey];
  };

  // ✅ Menu items with permission mapping
  const menu = useMemo(() => {
    const items = [
      { name: "Dashboard", href: "/admin/dashboard", perm: null },

      { name: "Products", href: "/admin/products", perm: "products" },
      { name: "Categories", href: "/admin/categories", perm: "products" },
      { name: "Filters", href: "/admin/filters", perm: "products" },

      { name: "Orders", href: "/admin/orders", perm: "orders" },
      { name: "Coupons", href: "/admin/coupons", perm: "coupons" },

      { name: "Static Pages", href: "/admin/pages", perm: "pages" },

      { name: "Admin Users", href: "/admin/admin-users", perm: "adminUsers" },

      { name: "Store", href: "/admin/store", perm: "store" },
    ];

    // filter by permission
    return items.filter((i) => !i.perm || can(i.perm));
  }, [admin]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <aside className="w-64 bg-black text-white p-6 flex flex-col">
      {/* LOGO / BRAND */}
      <div className="mb-6">
        {/* <div className="flex items-center gap-2">
          {store?.logo ? (
            <img
              src={store.logo}
              alt={store.name || "Store Logo"}
              className="h-10 w-auto object-contain bg-white rounded px-2 py-1"
            />
          ) : (
            <h2 className="text-xl font-bold">
              {store?.name || "TikauFashion"} Admin
            </h2>
          )}
        </div> */}

        <div className="mt-3 border-t border-white/10 pt-3">
          {loading ? (
            <p className="text-xs text-gray-300">Loading admin...</p>
          ) : admin ? (
            <>
              <p className="text-sm font-semibold truncate">{admin.name}</p>
              <p className="text-xs text-gray-300 truncate">{admin.email}</p>
              <p className="text-[11px] mt-1 text-gray-300">
                Role: <span className="font-semibold">{admin.role}</span>
              </p>
            </>
          ) : (
            <p className="text-xs text-red-300">Unauthorized</p>
          )}
        </div>
      </div>

      {/* MENU */}
      <nav className="space-y-2 flex-1">
        {menu.map((m) => {
          const active = path === m.href || path.startsWith(m.href + "/");

          return (
            <Link
              key={m.href}
              href={m.href}
              className={`block px-3 py-2 rounded text-sm transition ${
                active ? "bg-white text-black" : "hover:bg-gray-800"
              }`}
            >
              {m.name}
            </Link>
          );
        })}

        {!loading && admin && menu.length === 1 && (
          <p className="text-xs text-gray-300 mt-3">
            No modules assigned. Please ask super admin to grant permissions.
          </p>
        )}
      </nav>

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="mt-6 text-left px-3 py-2 rounded bg-white/10 hover:bg-red-600 transition text-sm"
      >
        Logout
      </button>
    </aside>
  );
}
