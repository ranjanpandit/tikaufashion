"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag,
  IndianRupee,
  Truck,
  PackageCheck,
  RefreshCcw,
  AlertTriangle,
} from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadDashboard = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        setErr(json?.message || "Failed to load dashboard");
        setData(null);
        return;
      }

      setData(json);
    } catch (e) {
      setErr("Something went wrong while fetching dashboard data.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const statusMap = useMemo(() => {
    const map = {};
    data?.statusCounts?.forEach((s) => {
      map[s._id] = s.count;
    });
    return map;
  }, [data]);

  const codCount = useMemo(() => {
    return (
      data?.recentOrders?.filter((o) => o.paymentMethod === "COD").length || 0
    );
  }, [data]);

  const prepaidCount = useMemo(() => {
    return (
      data?.recentOrders?.filter((o) => o.paymentMethod === "PREPAID").length ||
      0
    );
  }, [data]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Overview of orders, revenue and delivery status.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 border px-3 py-2 rounded bg-white hover:bg-gray-50 text-sm"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {err && (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded p-3 flex items-start gap-2">
          <AlertTriangle size={18} className="mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Dashboard Error</p>
            <p>{err}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Orders"
          value={data?.totalOrders || 0}
          icon={<ShoppingBag size={18} />}
        />
        <MetricCard
          title="Today's Orders"
          value={data?.todayOrders || 0}
          icon={<ShoppingBag size={18} />}
        />
        <MetricCard
          title="Total Revenue"
          value={`₹ ${formatINR(data?.totalRevenue || 0)}`}
          icon={<IndianRupee size={18} />}
        />
        <MetricCard
          title="Pending Orders"
          value={statusMap?.pending || 0}
          icon={<Truck size={18} />}
        />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatusCard
          title="Shipped"
          value={statusMap?.shipped || 0}
          icon={<Truck size={18} />}
          badge="In Transit"
        />
        <StatusCard
          title="Delivered"
          value={statusMap?.delivered || 0}
          icon={<PackageCheck size={18} />}
          badge="Completed"
        />
        <StatusCard
          title="Payment Mix"
          value={`${codCount} / ${prepaidCount}`}
          icon={<IndianRupee size={18} />}
          badge="COD / Prepaid"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            <p className="text-sm text-gray-500">
              Latest transactions and order updates.
            </p>
          </div>
        </div>

        {!data?.recentOrders?.length ? (
          <div className="p-6 text-sm text-gray-500">
            No recent orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left font-medium p-3">Order</th>
                  <th className="text-left font-medium p-3">Customer</th>
                  <th className="text-left font-medium p-3">Amount</th>
                  <th className="text-left font-medium p-3">Payment</th>
                  <th className="text-left font-medium p-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">
                      #{String(o._id).slice(-6)}
                    </td>
                    <td className="p-3">{o?.customer?.name || "-"}</td>
                    <td className="p-3">₹ {formatINR(o?.total || 0)}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 rounded border bg-white text-xs">
                        {o?.paymentMethod || "-"}
                      </span>
                    </td>
                    <td className="p-3">
                      <StatusPill value={o?.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- UI COMPONENTS -------------------------------- */

function MetricCard({ title, value, icon }) {
  return (
    <div className="bg-white border rounded-lg p-4 flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function StatusCard({ title, value, icon, badge }) {
  return (
    <div className="bg-white border rounded-lg p-4 flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-2">{badge}</p>
      </div>
      <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function StatusPill({ value }) {
  const v = String(value || "").toLowerCase();

  let label = value || "-";
  let cls = "bg-gray-100 text-gray-700 border-gray-200";

  if (v === "pending") cls = "bg-yellow-50 text-yellow-700 border-yellow-200";
  if (v === "shipped") cls = "bg-blue-50 text-blue-700 border-blue-200";
  if (v === "delivered") cls = "bg-green-50 text-green-700 border-green-200";
  if (v === "cancelled") cls = "bg-red-50 text-red-700 border-red-200";

  return (
    <span className={`px-2 py-1 rounded border text-xs ${cls}`}>
      {label}
    </span>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border rounded-lg p-4 space-y-3"
          >
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse ml-auto" />
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-60 bg-gray-200 rounded animate-pulse mt-2" />
        <div className="h-32 bg-gray-200 rounded animate-pulse mt-5" />
      </div>
    </div>
  );
}

/* -------------------------------- HELPERS -------------------------------- */

function formatINR(value) {
  try {
    return Number(value).toLocaleString("en-IN");
  } catch {
    return value;
  }
}
