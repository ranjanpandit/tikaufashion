"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function CouponFormPage() {
  const router = useRouter();
  const { id } = useParams();
  const isNew = id === "new";

  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: "",
    minOrder: "",
    maxDiscount: "",
    usageLimit: "",
    expiresAt: "",
    isActive: true,
  });

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/coupons`)
        .then((r) => r.json())
        .then((list) => {
          const c = list.find((x) => x._id === id);
          if (c)
            setForm({
              ...c,
              expiresAt: c.expiresAt.slice(0, 10),
            });
        });
    }
  }, [id, isNew]);

  async function saveCoupon(e) {
    e.preventDefault();
    const payload = {
      ...form,
      maxDiscount: form.maxDiscount === "" ? null : Number(form.maxDiscount),
      usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
      minOrder: form.minOrder === "" ? 0 : Number(form.minOrder),
      value: Number(form.value),
    };

    await fetch(isNew ? "/api/admin/coupons" : `/api/admin/coupons/${id}`, {
      method: isNew ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    router.push("/admin/coupons");
  }

  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-4">
        {isNew ? "Create" : "Edit"} Coupon
      </h1>

      <form
        onSubmit={saveCoupon}
        className="space-y-4 bg-white border p-5 rounded"
      >
        <input
          placeholder="Coupon Code"
          className="border p-2 w-full"
          value={form.code}
          onChange={(e) =>
            setForm({
              ...form,
              code: e.target.value,
            })
          }
          required
        />

        <select
          className="border p-2 w-full"
          value={form.type}
          onChange={(e) =>
            setForm({
              ...form,
              type: e.target.value,
            })
          }
        >
          <option value="percentage">Percentage</option>
          <option value="flat">Flat</option>
        </select>

        <input
          placeholder="Value"
          type="number"
          className="border p-2 w-full"
          value={form.value}
          onChange={(e) =>
            setForm({
              ...form,
              value: e.target.value,
            })
          }
          required
        />

        <input
          placeholder="Min Order"
          type="number"
          className="border p-2 w-full"
          value={form.minOrder}
          onChange={(e) =>
            setForm({
              ...form,
              minOrder: e.target.value,
            })
          }
        />

        <input
          placeholder="Max Discount"
          type="number"
          className="border p-2 w-full"
          value={form.maxDiscount}
          onChange={(e) =>
            setForm({
              ...form,
              maxDiscount: e.target.value,
            })
          }
        />

        <input
          placeholder="Usage Limit"
          type="number"
          className="border p-2 w-full"
          value={form.usageLimit}
          onChange={(e) =>
            setForm({
              ...form,
              usageLimit: e.target.value,
            })
          }
        />

        <input
          type="date"
          className="border p-2 w-full"
          value={form.expiresAt}
          onChange={(e) =>
            setForm({
              ...form,
              expiresAt: e.target.value,
            })
          }
          required
        />

        <label className="flex gap-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) =>
              setForm({
                ...form,
                isActive: e.target.checked,
              })
            }
          />
          Active
        </label>

        <button className="btn-brand px-6 py-2">Save Coupon</button>
      </form>
    </div>
  );
}
