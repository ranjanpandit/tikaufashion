"use client";

import { useRouter } from "next/navigation";

export default function OrderDetailsActions({ orderId }) {
  const router = useRouter();

  async function copyOrderId() {
    try {
      await navigator.clipboard.writeText(orderId);
      alert("✅ Order ID copied");
    } catch {
      alert("Copy failed");
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => router.push("/admin/orders")}
        className="text-sm border px-4 py-2 rounded bg-white hover:bg-gray-50"
      >
        ← Back
      </button>

      <button
        type="button"
        onClick={copyOrderId}
        className="text-sm border px-4 py-2 rounded bg-white hover:bg-gray-50"
      >
        Copy Order ID
      </button>

      <button
        type="button"
        onClick={() => router.refresh()}
        className="text-sm bg-black text-white px-4 py-2 rounded"
      >
        Refresh
      </button>
    </div>
  );
}
