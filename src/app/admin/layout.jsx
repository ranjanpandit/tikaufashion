"use client";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { usePathname, useRouter } from "next/navigation";


export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      {pathname !== "/admin/login" && <AdminSidebar />}
      
      {/* Main Content */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
