import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { requirePermission } from "@/lib/permission";

export default async function AdminUsersLayout({ children }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  if (!requirePermission(admin, "adminUsers")) redirect("/admin/unauthorized");

  return children;
}
