import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { requirePermission } from "@/lib/permission";

export default async function OrdersLayout({ children }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  if (!requirePermission(admin, "orders")) redirect("/admin/unauthorized");

  return children;
}
