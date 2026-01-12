"use client";

import { useEffect, useState } from "react";
import ImageUploader from "@/components/admin/ImageUploader";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { THEME_PRESETS } from "@/lib/themePresets";

function SortableItem({ id, slice, onRemove }) {
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
      {...attributes}
      className="border p-3 flex justify-between items-center bg-gray-50"
    >
      <span {...listeners} className="cursor-grab text-sm font-medium">
        ☰ {slice.type}
      </span>

      <button type="button" onClick={onRemove} className="text-red-600 text-sm">
        Remove
      </button>
    </li>
  );
}

export default function AdminStorePage() {
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);

  /* LOAD DATA */
  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  useEffect(() => {
    fetch("/api/admin/store")
      .then((r) => r.json())
      .then((data) => {
        setStore({
          ...data,
          featuredProducts: (data.featuredProducts || []).map((fp) =>
            String(fp._id || fp)
          ),
        });
      });
  }, []);

  /* BANNERS */
  function addBanner() {
    setStore((prev) => ({
      ...prev,
      banners: [...(prev.banners || []), { image: "", link: "" }],
    }));
  }

  function updateBanner(i, key, value) {
    const banners = [...store.banners];
    banners[i][key] = value;
    setStore({ ...store, banners });
  }

  function removeBanner(i) {
    setStore({
      ...store,
      banners: store.banners.filter((_, idx) => idx !== i),
    });
  }

  /* SAVE */
  async function handleSubmit(e) {
    e.preventDefault();

    await fetch("/api/admin/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(store),
    });

    alert("Store settings saved");
  }

  if (!store) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold">Store Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 border">
        {/* BASIC INFO */}
        <div className="space-y-4">
          <input
            className="border p-2 w-full"
            placeholder="Store Name"
            value={store.name || ""}
            onChange={(e) => setStore({ ...store, name: e.target.value })}
          />

          {/* LOGO UPLOAD */}
          <div>
            <label className="text-sm font-medium">Logo</label>
            <ImageUploader
              onUpload={(url) => setStore({ ...store, logo: url })}
            />

            {store.logo && (
              <img src={store.logo} className="h-16 mt-2 object-contain" />
            )}
          </div>
        </div>

        {/* BANNERS */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Hero Banners</h2>

          <div className="space-y-4">
            {(store.banners || []).map((b, i) => (
              <div key={i} className="border p-4 space-y-2">
                <ImageUploader
                  onUpload={(url) => updateBanner(i, "image", url)}
                />

                {b.image && <img src={b.image} className="h-24 object-cover" />}

                <input
                  className="border p-2 w-full"
                  placeholder="Link (optional)"
                  value={b.link || ""}
                  onChange={(e) => updateBanner(i, "link", e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => removeBanner(i)}
                  className="text-red-600 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addBanner}
            className="mt-3 bg-gray-800 text-white px-4 py-2"
          >
            + Add Banner
          </button>
        </div>
        {/* {Megamenu section} */}
        {/* MEGA MENU */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Header Menu</h2>

          {(store.menu || []).map((item, i) => (
            <div key={i} className="border p-4 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border p-2"
                  placeholder="Menu Label"
                  value={item.label}
                  onChange={(e) => {
                    const menu = [...store.menu];
                    menu[i].label = e.target.value;
                    setStore({ ...store, menu });
                  }}
                />

                <select
                  className="border p-2"
                  value={item.type}
                  onChange={(e) => {
                    const menu = [...store.menu];
                    menu[i].type = e.target.value;
                    setStore({ ...store, menu });
                  }}
                >
                  <option value="link">Simple Link</option>
                  <option value="mega">Mega Menu</option>
                </select>
              </div>

              {/* SIMPLE LINK */}
              {item.type === "link" && (
                <input
                  className="border p-2 mt-2 w-full"
                  placeholder="/shop"
                  value={item.slug}
                  onChange={(e) => {
                    const menu = [...store.menu];
                    menu[i].slug = e.target.value;
                    setStore({ ...store, menu });
                  }}
                />
              )}

              {/* MEGA MENU COLUMNS */}
              {item.type === "mega" && (
                <div className="mt-3 space-y-3">
                  {(item.columns || []).map((col, ci) => (
                    <div key={ci} className="border p-3">
                      <input
                        className="border p-2 w-full mb-2"
                        placeholder="Column Title"
                        value={col.title}
                        onChange={(e) => {
                          const menu = [...store.menu];
                          menu[i].columns[ci].title = e.target.value;
                          setStore({ ...store, menu });
                        }}
                      />

                      {(col.links || []).map((link, li) => (
                        <div key={li} className="flex gap-2 mb-2">
                          <input
                            className="border p-2 flex-1"
                            placeholder="Label"
                            value={link.label}
                            onChange={(e) => {
                              const menu = [...store.menu];
                              menu[i].columns[ci].links[li].label =
                                e.target.value;
                              setStore({ ...store, menu });
                            }}
                          />

                          <input
                            className="border p-2 flex-1"
                            placeholder="/category/men"
                            value={link.href}
                            onChange={(e) => {
                              const menu = [...store.menu];
                              menu[i].columns[ci].links[li].href =
                                e.target.value;
                              setStore({ ...store, menu });
                            }}
                          />
                        </div>
                      ))}

                      <button
                        type="button"
                        className="text-sm text-blue-600"
                        onClick={() => {
                          const menu = [...store.menu];
                          menu[i].columns[ci].links.push({
                            label: "",
                            href: "",
                          });
                          setStore({ ...store, menu });
                        }}
                      >
                        + Add Link
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    className="text-sm text-blue-600"
                    onClick={() => {
                      const menu = [...store.menu];
                      menu[i].columns.push({
                        title: "",
                        links: [],
                      });
                      setStore({ ...store, menu });
                    }}
                  >
                    + Add Column
                  </button>
                </div>
              )}

              <button
                type="button"
                className="text-red-600 text-sm mt-2"
                onClick={() => {
                  setStore({
                    ...store,
                    menu: store.menu.filter((_, idx) => idx !== i),
                  });
                }}
              >
                Remove Menu Item
              </button>
            </div>
          ))}

          <button
            type="button"
            className="bg-gray-800 text-white px-4 py-2"
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
        </div>

        {/* FEATURED PRODUCTS */}
        <div className="border rounded-md">
          {/* Sticky header */}
          <div className="sticky top-0 bg-white z-10 p-3 border-b">
            <h2 className="text-xl font-semibold">Featured Products</h2>
            <p className="text-xs text-gray-500">
              Select products to show on homepage
            </p>
          </div>

          {/* Scrollable content */}
          <div className="max-h-[420px] overflow-y-auto p-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {products.map((p) => {
                const selected = (store.featuredProducts || []).some(
                  (fp) => String(fp) === String(p._id)
                );

                return (
                  <label
                    key={p._id}
                    className={`border p-2 cursor-pointer rounded ${
                      selected ? "border-brand bg-gray-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        const current = store.featuredProducts || [];

                        const updated = e.target.checked
                          ? [...new Set([...current, p._id])]
                          : current.filter(
                              (id) => String(id) !== String(p._id)
                            );

                        setStore({
                          ...store,
                          featuredProducts: updated,
                        });
                      }}
                      className="mr-2"
                    />

                    <img
                      src={p.images?.[0]}
                      className="h-28 w-full object-cover rounded"
                    />

                    <p className="text-sm mt-1 line-clamp-2">{p.name}</p>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* HOMEPAGE SLICES */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Homepage Sections</h2>

          <select
            className="border p-2 mb-4"
            onChange={(e) => {
              const type = e.target.value;
              if (!type) return;

              setStore({
                ...store,
                homepageSlices: [...(store.homepageSlices || []), { type }],
              });
            }}
          >
            <option value="">Add Section</option>
            <option value="hero">Hero Banner</option>
            <option value="featured">Featured Products</option>
            <option value="best_selling">Best Selling Products</option>
          </select>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={({ active, over }) => {
              if (!over || active.id === over.id) return;

              const updated = arrayMove(
                store.homepageSlices,
                active.id,
                over.id
              );

              setStore({
                ...store,
                homepageSlices: updated,
              });
            }}
          >
            <SortableContext
              items={store.homepageSlices.map((_, i) => i)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-2">
                {store.homepageSlices.map((slice, i) => (
                  <SortableItem
                    key={i}
                    id={i}
                    slice={slice}
                    onRemove={() =>
                      setStore({
                        ...store,
                        homepageSlices: store.homepageSlices.filter(
                          (_, idx) => idx !== i
                        ),
                      })
                    }
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </div>
        {/* {theme setting} */}

        <div>
          <h2 className="text-xl font-semibold mb-3">Theme Settings</h2>
          <div className="flex gap-2 mb-4">
            {Object.keys(THEME_PRESETS).map((key) => (
              <button
                type="button"
                key={key}
                className="border px-3 py-1 text-sm rounded hover:bg-gray-100"
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
                className="w-full h-10"
                value={store.theme?.primaryColor || "#000000"}
                onChange={(e) =>
                  setStore({
                    ...store,
                    theme: {
                      ...store.theme,
                      primaryColor: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Secondary Color</label>
              <input
                type="color"
                className="w-full h-10"
                value={store.theme?.secondaryColor || "#666666"}
                onChange={(e) =>
                  setStore({
                    ...store,
                    theme: {
                      ...store.theme,
                      secondaryColor: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Button Radius</label>
              <select
                className="border p-2 w-full"
                value={store.theme?.buttonRadius || "0.375rem"}
                onChange={(e) =>
                  setStore({
                    ...store,
                    theme: {
                      ...store.theme,
                      buttonRadius: e.target.value,
                    },
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
                className="border p-2 w-full"
                value={store.theme?.fontFamily}
                onChange={(e) =>
                  setStore({
                    ...store,
                    theme: {
                      ...store.theme,
                      fontFamily: e.target.value,
                    },
                  })
                }
              >
                <option value="Inter, system-ui, sans-serif">Inter</option>
                <option value="Poppins, system-ui, sans-serif">Poppins</option>
                <option value="Roboto, system-ui, sans-serif">Roboto</option>
              </select>
            </div>
          </div>
        </div>

        <button className="btn-brand px-6 py-2">Save Store Settings</button>
      </form>
    </div>
  );
}
