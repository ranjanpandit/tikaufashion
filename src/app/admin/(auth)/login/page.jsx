"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ If already logged in, go to dashboard
  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => {
        if (res.ok) router.replace("/admin/dashboard");
      })
      .catch(() => {});
  }, [router]);

  async function handleLogin(e) {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.message || "Invalid credentials");
        return;
      }

      // ✅ Push admin dashboard after login
      router.replace("/admin/dashboard");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-3">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-2">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-4">
          Login to manage products, orders and store settings.
        </p>

        {error && (
          <p className="text-red-600 text-sm mb-3 bg-red-50 p-2 rounded">
            {error}
          </p>
        )}

        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          placeholder="admin@email.com"
          className="w-full border p-2 mb-3 mt-1 rounded focus:outline-none focus:ring-2 focus:ring-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          placeholder="********"
          className="w-full border p-2 mb-4 mt-1 rounded focus:outline-none focus:ring-2 focus:ring-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
