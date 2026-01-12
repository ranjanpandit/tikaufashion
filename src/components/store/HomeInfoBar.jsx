export default function HomeInfoBar({ store }) {
  return (
    <div className="bg-gray-100 border-b">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-center text-sm">
        <div>🚚 <b>Free Shipping</b><br />Above ₹999</div>
        <div>🔒 <b>Secure Payment</b><br />100% Safe</div>
        <div>🔄 <b>Easy Returns</b><br />7 Days</div>
        <div>⭐ <b>{store.rating || "4.8"}/5</b><br />Trusted</div>
      </div>
    </div>
  );
}
