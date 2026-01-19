"use client";

import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border rounded-xl p-6 text-center">
        <h1 className="text-xl font-bold">Access Denied</h1>
        <p className="text-sm text-gray-600 mt-2">
          You don’t have permission to access this module.
        </p>

        <button
          onClick={() => router.push("/admin/dashboard")}
          className="mt-5 bg-black text-white px-4 py-2 rounded text-sm"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
