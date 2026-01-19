import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { requirePermission } from "@/lib/permission";

export default async function ProductsLayout({ children }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  if (!requirePermission(admin, "products")) redirect("/admin/unauthorized");

  return children;
}
