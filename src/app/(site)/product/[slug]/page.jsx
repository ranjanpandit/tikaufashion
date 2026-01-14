import { notFound } from "next/navigation";
import ProductClient from "@/components/store/ProductClient";

async function getProduct(slug) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/products/${slug}`,
    { cache: "no-store" }
  );

  if (!res.ok) return null;
  return res.json();
}

export default async function ProductDetail({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return notFound();

  return <ProductClient product={product} />;
}
