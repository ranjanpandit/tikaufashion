import Link from "next/link";

export default function OrderSuccess() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-2xl font-bold">Order Placed 🎉</h1>
      <p className="mt-2">Thank you for shopping with TikauFashion.</p>

      <Link href="/shop" className="underline mt-4 block">
        Continue Shopping
      </Link>
    </div>
  );
}
