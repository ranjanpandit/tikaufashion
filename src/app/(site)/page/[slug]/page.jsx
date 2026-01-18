import { connectMongo } from "@/lib/mongodb";
import StaticPage from "@/models/StaticPage";
import { notFound } from "next/navigation";

export default async function PublicStaticPage({ params }) {
  const { slug } = await params; // ✅ FIX (params is Promise in Next 16)

  await connectMongo();

  const page = await StaticPage.findOne({
    slug,
    status: "published",
  });

  if (!page) return notFound();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{page.title}</h1>

      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
