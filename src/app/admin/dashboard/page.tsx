"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Admin {
  id: string;
  username: string;
  type: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.authenticated || data.user?.type !== "ADMIN") {
          router.push("/admin/login");
          return;
        }

        setAdmin(data.user);
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-indigo-600">Dealbox</h1>
            <p className="text-sm text-gray-500">Admin Panel</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{admin?.username}</span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900">-</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Restaurants</p>
            <p className="text-3xl font-bold text-gray-900">-</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Coupons Generated</p>
            <p className="text-3xl font-bold text-gray-900">-</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Coupons Used</p>
            <p className="text-3xl font-bold text-gray-900">-</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/admin/restaurants"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Manage Restaurants
            </h3>
            <p className="text-gray-600">
              Add, edit, or remove restaurant partners
            </p>
          </Link>

          <Link
            href="/admin/coupons"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              View Coupons
            </h3>
            <p className="text-gray-600">
              Browse all coupons with filters
            </p>
          </Link>

          <Link
            href="/admin/stats"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Statistics
            </h3>
            <p className="text-gray-600">
              View detailed platform statistics
            </p>
          </Link>
        </div>

        <div className="mt-8 bg-yellow-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            MVP Note
          </h3>
          <p className="text-yellow-700">
            This is the Milestone 1 foundation. Full admin functionality will be
            implemented in Milestone 4.
          </p>
        </div>
      </main>
    </div>
  );
}
