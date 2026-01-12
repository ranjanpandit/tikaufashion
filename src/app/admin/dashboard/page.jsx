"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  const statusMap = {};
  data?.statusCounts?.forEach((s) => {
    statusMap[s._id] = s.count;
  });

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-6">
        <StatCard title="Total Orders" value={data.totalOrders} />
        <StatCard title="Today's Orders" value={data.todayOrders} />
        <StatCard
          title="Total Revenue"
          value={`₹${data.totalRevenue}`}
        />
        <StatCard
          title="Pending Orders"
          value={statusMap.pending || 0}
        />
      </div>

      {/* ORDER STATUS */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title="Shipped"
          value={statusMap.shipped || 0}
        />
        <StatCard
          title="Delivered"
          value={statusMap.delivered || 0}
        />
        <StatCard
          title="COD / Prepaid"
          value={
            data?.recentOrders?.filter(
              (o) => o.paymentMethod === "COD"
            ).length +
            " / " +
            data?.recentOrders.filter(
              (o) => o.paymentMethod === "PREPAID"
            ).length
          }
        />
      </div>

      {/* RECENT ORDERS */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Recent Orders
        </h2>

        <div className="border">
          {data.recentOrders.map((o) => (
            <div
              key={o._id}
              className="flex justify-between p-3 border-b text-sm"
            >
              <span>#{o._id.slice(-6)}</span>
              <span>{o.customer.name}</span>
              <span>₹{o.total}</span>
              <span>{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="border p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
