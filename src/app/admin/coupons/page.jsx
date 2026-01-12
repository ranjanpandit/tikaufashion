"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then(setCoupons);
  }, []);

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <Link
          href="/admin/coupons/new"
          className="btn-brand px-4 py-2"
        >
          + Create Coupon
        </Link>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Code</th>
            <th>Type</th>
            <th>Value</th>
            <th>Used</th>
            <th>Expiry</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c._id} className="border-t">
              <td className="p-2 font-medium">
                {c.code}
              </td>
              <td>{c.type}</td>
              <td>
                {c.type === "percentage"
                  ? `${c.value}%`
                  : `₹${c.value}`}
              </td>
              <td>
                {c.usedCount}/
                {c.usageLimit ?? "∞"}
              </td>
              <td>
                {new Date(
                  c.expiresAt
                ).toLocaleDateString()}
              </td>
              <td>
                {c.isActive ? "Active" : "Disabled"}
              </td>
              <td>
                <Link
                  href={`/admin/coupons/${c._id}`}
                  className="text-blue-600"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
