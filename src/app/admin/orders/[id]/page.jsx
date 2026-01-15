import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";

async function getAdminOrder(id) {
  const h = await headers();
  const host = h.get("host");

  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(`${protocol}://${host}/api/admin/orders/${id}`, {
    cache: "no-store",
    headers: {
      cookie: h.get("cookie") || "",
    },
  });

  if (!res.ok) return null;
  return res.json();
}

function Badge({ children }) {
  return (
    <span className="px-2 py-1 text-xs rounded-full border bg-gray-50">
      {children}
    </span>
  );
}

export default async function AdminOrderDetailsPage({ params }) {
  const { id } = await params;
  const order = await getAdminOrder(id);

  if (!order) return notFound();

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            Order ID: <b>{order._id}</b>
          </p>
        </div>

        <Link href="/admin/orders" className="text-sm text-blue-600">
          ← Back
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* CUSTOMER */}
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold mb-3">Customer</h2>
            <p className="text-sm">
              <b>{order.customer?.name}</b>
            </p>
            <p className="text-sm text-gray-600">{order.customer?.email}</p>
            <p className="text-sm text-gray-600">{order.customer?.phone}</p>
          </div>

          {/* ADDRESS */}
          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-semibold mb-3">Delivery Address</h2>
            <p className="text-sm">{order.address?.line1}</p>
            <p className="text-sm text-gray-600">
              {order.address?.city}, {order.address?.state} -{" "}
              {order.address?.pincode}
            </p>
          </div>

          {/* ITEMS */}
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Items</h2>
              <span className="text-sm text-gray-600">
                {order.items?.length || 0} item(s)
              </span>
            </div>

            <div className="divide-y">
              {(order.items || []).map((item, idx) => (
                <div key={idx} className="p-4 flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover border rounded-lg"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>

                    {item.selectedOptions &&
                      Object.keys(item.selectedOptions).length > 0 && (
                        <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-2">
                          {Object.entries(item.selectedOptions).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-1 bg-gray-100 rounded-full"
                            >
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}

                    <div className="flex justify-between items-center mt-3 text-sm">
                      <span className="text-gray-600">
                        ₹{item.price} × {item.qty}
                      </span>
                      <span className="font-semibold">
                        ₹{item.price * item.qty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-5 lg:sticky lg:top-6">
            <h2 className="font-semibold mb-4">Summary</h2>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge>Status: {order.status}</Badge>
              <Badge>{order.paymentMethod}</Badge>
              <Badge>{order.paymentStatus}</Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{order.subtotal || 0}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}

              {order.coupon?.code && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Coupon</span>
                  <span>{order.coupon.code}</span>
                </div>
              )}

              <div className="border-t pt-3 mt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{order.total}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Placed on: {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
