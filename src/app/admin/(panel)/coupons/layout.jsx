import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { requirePermission } from "@/lib/permission";

export default async function CouponsLayout({ children }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  if (!requirePermission(admin, "coupons")) redirect("/admin/unauthorized");

  return children;
}
