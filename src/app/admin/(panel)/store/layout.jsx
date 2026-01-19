import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { requirePermission } from "@/lib/permission";

export default async function StoreLayout({ children }) {
  const admin = await requireAdmin();

  if (!admin) redirect("/admin/login");

  const ok = requirePermission(admin, "store");
  if (!ok) redirect("/admin/unauthorized");

  return children;
}
