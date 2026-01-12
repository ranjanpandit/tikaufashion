import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">

          {/* BRAND */}
          <div>
            <h3 className="font-semibold text-lg mb-3">
              TikauFashion
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Premium fashion for everyday style.  
              Handpicked collections with quality you can trust.
            </p>
          </div>

          {/* SHOP */}
          <div>
            <h4 className="font-semibold mb-3">Shop</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/">New Arrivals</Link></li>
              <li><Link href="/">Featured</Link></li>
              <li><Link href="/">Best Sellers</Link></li>
            </ul>
          </div>

          {/* CUSTOMER */}
          <div>
            <h4 className="font-semibold mb-3">Customer</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/orders">My Orders</Link></li>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/faq">FAQs</Link></li>
            </ul>
          </div>

          {/* TRUST */}
          <div>
            <h4 className="font-semibold mb-3">Why Choose Us</h4>
            <ul className="space-y-2 text-gray-600">
              <li>🚚 Free Shipping Above ₹999</li>
              <li>🔄 7-Day Easy Returns</li>
              <li>🔒 Secure Payments</li>
              <li>💯 Quality Guaranteed</li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="border-t mt-10 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} TikauFashion. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
