import { headers } from "next/headers";
import { notFound } from "next/navigation";

async function getOrder(id) {
  const h = await headers(); // ✅ FIX
  const host = h.get("host");

  const protocol =
    process.env.NODE_ENV === "development"
      ? "http"
      : "https";

  const res = await fetch(
    `${protocol}://${host}/api/orders/${id}`,
    {
      cache: "no-store",
      headers: {
        cookie: h.get("cookie") || "", // 🔥 forward cookies
      },
    }
  );

  if (!res.ok) return null;
  return res.json();
}



export default async function OrderDetailsPage({ params }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) return notFound();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Order Details
      </h1>

      {/* ORDER INFO */}
      <div className="border p-4 mb-6 bg-white">
        <p><b>Order ID:</b> {order?._id}</p>
        <p><b>Status:</b> {order?.status}</p>
        <p><b>Payment:</b> {order?.paymentMethod}</p>
        <p><b>Total:</b> ₹{order?.total}</p>
        <p>
          <b>Placed On:</b>{" "}
          {new Date(order?.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* CUSTOMER */}
      <div className="border p-4 mb-6 bg-white">
        <h2 className="font-semibold mb-2">
          Customer Details
        </h2>
        <p>{order.customer?.name}</p>
        <p>{order.customer?.email}</p>
        <p>{order.customer?.phone}</p>
      </div>

      {/* ADDRESS */}
      <div className="border p-4 mb-6 bg-white">
        <h2 className="font-semibold mb-2">
          Delivery Address
        </h2>
        <p>{order.address?.line1}</p>
        <p>
          {order.address?.city},{" "}
          {order.address?.state} {" "}
          {order.address?.pincode}
        </p>
      </div>

      {/* ITEMS */}
      <div className="border p-4 bg-white">
        <h2 className="font-semibold mb-4">
          Items
        </h2>

        {order.items.map((item, i) => (
          <div
            key={i}
            className="flex gap-4 border-b py-3 last:border-0"
          >
            <img
              src={item.image}
              className="w-20 h-20 object-cover border"
            />

            <div className="flex-1">
              <p className="font-medium">
                {item.name}
              </p>

              {item.selectedOptions && (
                <div className="text-sm text-gray-600">
                  {Object.entries(
                    item.selectedOptions
                  ).map(([k, v]) => (
                    <span key={k} className="mr-2">
                      {k}: {v}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-1 text-sm">
                ₹{item.price} × {item.qty}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
