"use client";

import { useEffect, useMemo, useState } from "react";
import ImageUploader from "@/components/admin/ImageUploader";
import { THEME_PRESETS } from "@/lib/themePresets";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function SectionCard({ title, subtitle, children, right }) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="p-4 border-b flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "px-3 py-2 text-sm rounded border",
        active
          ? "bg-black text-white border-black"
          : "bg-white hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------ Sortable Item ------------------------------ */

function SortableSlice({ id, slice, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-3 flex items-center justify-between bg-white"
    >
      <div className="flex items-center gap-3">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab select-none text-gray-500"
          title="Drag to reorder"
        >
          ☰
        </span>
        <div>
          <p className="text-sm font-semibold">{slice.type}</p>
          <p className="text-xs text-gray-500">Homepage section</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="text-sm text-red-600 hover:underline"
      >
        Remove
      </button>
    </li>
  );
}

/* -------------------------------------------------------------------------- */

export default function AdminStorePage() {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);

  const [activeTab, setActiveTab] = useState("general");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [productSearch, setProductSearch] = useState("");

  /* LOAD DATA */
  const loadAll = async () => {
    setLoading(true);
    setMessage("");

    try {
      const [productsRes, storeRes] = await Promise.all([
        fetch("/api/admin/products", { cache: "no-store" }),
        fetch("/api/admin/store", { cache: "no-store" }),
      ]);

      const prodJson = await productsRes.json();
      const storeJson = await storeRes.json();

      setProducts(Array.isArray(prodJson) ? prodJson : []);

      // normalize featuredProducts to array of string ids
      setStore({
        ...storeJson,
        featuredProducts: (storeJson.featuredProducts || []).map((fp) =>
          String(fp?._id || fp)
        ),
        banners: storeJson.banners || [],
        menu: storeJson.menu || [],
        homepageSlices: (storeJson.homepageSlices || []).map((s) => ({
          id: s?.id || crypto.randomUUID(), // ✅ always present
          type: s?.type,
        })),
        theme: storeJson.theme || {},
      });
    } catch (e) {
      setMessage("Failed to load store settings. Please refresh.");
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  /* ------------------------------ Banner CRUD ------------------------------ */

  function addBanner() {
    setStore((prev) => ({
      ...prev,
      banners: [...(prev.banners || []), { image: "", link: "" }],
    }));
  }

  function updateBanner(i, key, value) {
    const banners = [...(store.banners || [])];
    banners[i] = { ...(banners[i] || {}), [key]: value };
    setStore({ ...store, banners });
  }

  function removeBanner(i) {
    setStore((prev) => ({
      ...prev,
      banners: (prev.banners || []).filter((_, idx) => idx !== i),
    }));
  }

  /* ---------------------------------- SAVE ---------------------------------- */

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/store", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(json?.message || "Save failed. Please try again.");
        return;
      }

      setMessage("✅ Store settings saved successfully");
    } catch (e) {
      setMessage("Save failed due to network issue.");
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------ Featured Filter ------------------------------ */

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => (p?.name || "").toLowerCase().includes(q));
  }, [products, productSearch]);

  /* ----------------------------------- UI ----------------------------------- */

  if (loading) return <div className="p-6">Loading store settings...</div>;
  if (!store) return <div className="p-6 text-red-600">Store not found.</div>;

  return (
    <div className="p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
          <p className="text-sm text-gray-500">
            Configure branding, banners, homepage and navigation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAll}
            className="border px-3 py-2 rounded bg-white hover:bg-gray-50 text-sm"
          >
            Refresh
          </button>

          <button
            type="submit"
            form="store-settings-form"
            disabled={saving}
            className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {message && (
        <div className="border rounded-lg p-3 bg-gray-50 text-sm">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton
          active={activeTab === "general"}
          onClick={() => setActiveTab("general")}
        >
          General
        </TabButton>
        <TabButton
          active={activeTab === "banners"}
          onClick={() => setActiveTab("banners")}
        >
          Banners
        </TabButton>
        <TabButton
          active={activeTab === "menu"}
          onClick={() => setActiveTab("menu")}
        >
          Header Menu
        </TabButton>
        <TabButton
          active={activeTab === "featured"}
          onClick={() => setActiveTab("featured")}
        >
          Featured Products
        </TabButton>
        <TabButton
          active={activeTab === "homepage"}
          onClick={() => setActiveTab("homepage")}
        >
          Homepage Sections
        </TabButton>
        <TabButton
          active={activeTab === "theme"}
          onClick={() => setActiveTab("theme")}
        >
          Theme
        </TabButton>
      </div>

      <form
        id="store-settings-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* ------------------------------ GENERAL TAB ------------------------------ */}
        {activeTab === "general" && (
          <SectionCard
            title="Basic Information"
            subtitle="Store name and branding settings."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Store Name</label>
                <input
                  className="border p-2 w-full rounded mt-1"
                  placeholder="TikauFashion"
                  value={store.name || ""}
                  onChange={(e) => setStore({ ...store, name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Store Logo</label>
                <div className="mt-1">
                  <ImageUploader
                    folder="logo"
                    onUpload={(url) => setStore((p) => ({ ...p, logo: url }))}
                  />
                </div>

                {store.logo && (
                  <img
                    src={store.logo}
                    alt="logo"
                    className="h-14 mt-2 object-contain border rounded p-2 bg-white"
                  />
                )}
              </div>
            </div>
          </SectionCard>
        )}

        {/* ------------------------------ BANNERS TAB ------------------------------ */}
        {activeTab === "banners" && (
          <SectionCard
            title="Hero Banners"
            subtitle="Used on homepage top slider."
            right={
              <button
                type="button"
                onClick={addBanner}
                className="border px-3 py-2 rounded bg-white hover:bg-gray-50 text-sm"
              >
                + Add Banner
              </button>
            }
          >
            <div className="space-y-4">
              {(store.banners || []).length === 0 && (
                <div className="text-sm text-gray-500">
                  No banners added. Click “Add Banner”.
                </div>
              )}

              {(store.banners || []).map((b, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 bg-white space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">Banner #{i + 1}</p>
                      <p className="text-xs text-gray-500">
                        Upload image + optional link.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBanner(i)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  <ImageUploader
                    folder="banners"
                    onUpload={(url) => updateBanner(i, "image", url)}
                  />

                  {b.image && (
                    <img
                      src={b.image}
                      alt="banner"
                      className="h-28 w-full object-cover rounded border"
                    />
                  )}

                  <div>
                    <label className="text-sm font-medium">
                      Link (optional)
                    </label>
                    <input
                      className="border p-2 w-full rounded mt-1"
                      placeholder="/shop or https://..."
                      value={b.link || ""}
                      onChange={(e) => updateBanner(i, "link", e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ------------------------------ MENU TAB ------------------------------ */}
        {activeTab === "menu" && (
          <SectionCard
            title="Header Menu"
            subtitle="Configure top navigation and mega menu."
            right={
              <button
                type="button"
                className="border px-3 py-2 rounded bg-white hover:bg-gray-50 text-sm"
                onClick={() =>
                  setStore({
                    ...store,
                    menu: [
                      ...(store.menu || []),
                      { label: "", type: "link", slug: "" },
                    ],
                  })
                }
              >
                + Add Menu Item
              </button>
            }
          >
            <div className="space-y-4">
              {(store.menu || []).length === 0 && (
                <div className="text-sm text-gray-500">
                  No menu items. Click “Add Menu Item”.
                </div>
              )}

              {(store.menu || []).map((item, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 bg-white space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Menu Item #{i + 1}
                      </p>
                      <p className="text-xs text-gray-500">
                        Link or Mega Menu columns.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="text-red-600 text-sm hover:underline"
                      onClick={() =>
                        setStore({
                          ...store,
                          menu: store.menu.filter((_, idx) => idx !== i),
                        })
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Label</label>
                      <input
                        className="border p-2 rounded w-full mt-1"
                        placeholder="Men / Women / Sale"
                        value={item.label || ""}
                        onChange={(e) => {
                          const menu = [...store.menu];
                          menu[i] = { ...menu[i], label: e.target.value };
                          setStore({ ...store, menu });
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Type</label>
                      <select
                        className="border p-2 rounded w-full mt-1"
                        value={item.type || "link"}
                        onChange={(e) => {
                          const menu = [...store.menu];
                          menu[i] = { ...menu[i], type: e.target.value };
                          // init mega structure if needed
                          if (e.target.value === "mega" && !menu[i].columns) {
                            menu[i].columns = [];
                          }
                          setStore({ ...store, menu });
                        }}
                      >
                        <option value="link">Simple Link</option>
                        <option value="mega">Mega Menu</option>
                      </select>
                    </div>
                  </div>

                  {/* SIMPLE LINK */}
                  {item.type === "link" && (
                    <div>
                      <label className="text-sm font-medium">URL</label>
                      <input
                        className="border p-2 rounded w-full mt-1"
                        placeholder="/shop"
                        value={item.slug || ""}
                        onChange={(e) => {
                          const menu = [...store.menu];
                          menu[i] = { ...menu[i], slug: e.target.value };
                          setStore({ ...store, menu });
                        }}
                      />
                    </div>
                  )}

                  {/* MEGA MENU */}
                  {item.type === "mega" && (
                    <div className="space-y-3">
                      {(item.columns || []).map((col, ci) => (
                        <div
                          key={ci}
                          className="border rounded p-3 bg-gray-50 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold">
                              Column #{ci + 1}
                            </p>
                            <button
                              type="button"
                              className="text-red-600 text-xs hover:underline"
                              onClick={() => {
                                const menu = [...store.menu];
                                menu[i].columns = menu[i].columns.filter(
                                  (_, idx) => idx !== ci
                                );
                                setStore({ ...store, menu });
                              }}
                            >
                              Remove Column
                            </button>
                          </div>

                          <input
                            className="border p-2 rounded w-full"
                            placeholder="Column Title (e.g. Topwear)"
                            value={col.title || ""}
                            onChange={(e) => {
                              const menu = [...store.menu];
                              menu[i].columns[ci] = {
                                ...menu[i].columns[ci],
                                title: e.target.value,
                              };
                              setStore({ ...store, menu });
                            }}
                          />

                          {(col.links || []).map((link, li) => (
                            <div
                              key={li}
                              className="grid grid-cols-1 md:grid-cols-2 gap-2"
                            >
                              <input
                                className="border p-2 rounded"
                                placeholder="Label"
                                value={link.label || ""}
                                onChange={(e) => {
                                  const menu = [...store.menu];
                                  menu[i].columns[ci].links[li] = {
                                    ...menu[i].columns[ci].links[li],
                                    label: e.target.value,
                                  };
                                  setStore({ ...store, menu });
                                }}
                              />
                              <input
                                className="border p-2 rounded"
                                placeholder="/category/men"
                                value={link.href || ""}
                                onChange={(e) => {
                                  const menu = [...store.menu];
                                  menu[i].columns[ci].links[li] = {
                                    ...menu[i].columns[ci].links[li],
                                    href: e.target.value,
                                  };
                                  setStore({ ...store, menu });
                                }}
                              />
                            </div>
                          ))}

                          <button
                            type="button"
                            className="text-sm text-blue-600 hover:underline"
                            onClick={() => {
                              const menu = [...store.menu];
                              menu[i].columns[ci].links = [
                                ...(menu[i].columns[ci].links || []),
                                { label: "", href: "" },
                              ];
                              setStore({ ...store, menu });
                            }}
                          >
                            + Add Link
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => {
                          const menu = [...store.menu];
                          menu[i].columns = [
                            ...(menu[i].columns || []),
                            { title: "", links: [] },
                          ];
                          setStore({ ...store, menu });
                        }}
                      >
                        + Add Column
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* --------------------------- FEATURED PRODUCTS TAB --------------------------- */}
        {activeTab === "featured" && (
          <SectionCard
            title="Featured Products"
            subtitle="These products appear on the homepage featured section."
            right={
              <div className="text-xs text-gray-500">
                Selected: {(store.featuredProducts || []).length}
              </div>
            }
          >
            <div className="mb-3">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="max-h-[520px] overflow-y-auto border rounded-lg p-3 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filteredProducts.map((p) => {
                  const selected = (store.featuredProducts || []).some(
                    (fp) => String(fp) === String(p._id)
                  );

                  return (
                    <label
                      key={p._id}
                      className={cx(
                        "border rounded-lg p-2 cursor-pointer bg-white",
                        selected
                          ? "border-black ring-1 ring-black"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const current = store.featuredProducts || [];
                            const updated = e.target.checked
                              ? [...new Set([...current, String(p._id)])]
                              : current.filter(
                                  (id) => String(id) !== String(p._id)
                                );

                            setStore({ ...store, featuredProducts: updated });
                          }}
                        />
                        <span className="text-xs text-gray-600">Featured</span>
                      </div>

                      <img
                        src={p.images?.[0] || "/placeholder.png"}
                        className="h-28 w-full object-cover rounded mt-2 border"
                        alt={p.name}
                      />
                      <p className="text-sm mt-2 line-clamp-2 font-medium">
                        {p.name}
                      </p>
                    </label>
                  );
                })}
              </div>
            </div>
          </SectionCard>
        )}

        {/* --------------------------- HOMEPAGE SECTIONS TAB --------------------------- */}
        {activeTab === "homepage" && (
          <SectionCard
            title="Homepage Sections"
            subtitle="Reorder sections using drag & drop."
          >
            <div className="flex flex-wrap gap-2 mb-4">
              <select
                className="border p-2 rounded"
                defaultValue=""
                onChange={(e) => {
                  const type = e.target.value;
                  if (!type) return;

                  setStore({
                    ...store,
                    homepageSlices: [
                      ...(store.homepageSlices || []),
                      { id: crypto.randomUUID(), type },
                    ],
                  });

                  e.target.value = "";
                }}
              >
                <option value="">Add Section</option>
                <option value="hero">Hero Banner</option>
                <option value="featured">Featured Products</option>
                <option value="best_selling">Best Selling Products</option>
              </select>
            </div>

            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (!over || active.id === over.id) return;

                const slices = store.homepageSlices || [];
                const oldIndex = slices.findIndex((s) => s.id === active.id);
                const newIndex = slices.findIndex((s) => s.id === over.id);

                if (oldIndex === -1 || newIndex === -1) return;

                setStore({
                  ...store,
                  homepageSlices: arrayMove(slices, oldIndex, newIndex),
                });
              }}
            >
              <SortableContext
                items={(store.homepageSlices || []).map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {(store.homepageSlices || []).map((slice) => (
                    <SortableSlice
                      key={slice.id}
                      id={slice.id}
                      slice={slice}
                      onRemove={() =>
                        setStore({
                          ...store,
                          homepageSlices: (store.homepageSlices || []).filter(
                            (s) => s.id !== slice.id
                          ),
                        })
                      }
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </SectionCard>
        )}

        {/* ------------------------------ THEME TAB ------------------------------ */}
        {activeTab === "theme" && (
          <SectionCard
            title="Theme Settings"
            subtitle="Set primary/secondary colors and typography."
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(THEME_PRESETS).map((key) => (
                <button
                  type="button"
                  key={key}
                  className="border px-3 py-2 text-sm rounded bg-white hover:bg-gray-50"
                  onClick={() =>
                    setStore({
                      ...store,
                      theme: {
                        ...THEME_PRESETS[key],
                        preset: key,
                      },
                    })
                  }
                >
                  {key.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Primary Color</label>
                <input
                  type="color"
                  className="w-full h-10 mt-1"
                  value={store.theme?.primaryColor || "#000000"}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      theme: { ...store.theme, primaryColor: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Secondary Color</label>
                <input
                  type="color"
                  className="w-full h-10 mt-1"
                  value={store.theme?.secondaryColor || "#666666"}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      theme: { ...store.theme, secondaryColor: e.target.value },
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Button Radius</label>
                <select
                  className="border p-2 w-full rounded mt-1"
                  value={store.theme?.buttonRadius || "0.375rem"}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      theme: { ...store.theme, buttonRadius: e.target.value },
                    })
                  }
                >
                  <option value="0">Square</option>
                  <option value="0.375rem">Rounded</option>
                  <option value="9999px">Pill</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Font Family</label>
                <select
                  className="border p-2 w-full rounded mt-1"
                  value={
                    store.theme?.fontFamily || "Inter, system-ui, sans-serif"
                  }
                  onChange={(e) =>
                    setStore({
                      ...store,
                      theme: { ...store.theme, fontFamily: e.target.value },
                    })
                  }
                >
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="Poppins, system-ui, sans-serif">
                    Poppins
                  </option>
                  <option value="Roboto, system-ui, sans-serif">Roboto</option>
                </select>
              </div>
            </div>
          </SectionCard>
        )}
      </form>
    </div>
  );
}
