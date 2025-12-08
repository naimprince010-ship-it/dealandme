"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Admin {
  id: string;
  username: string;
  type: string;
}

interface Stats {
  customers: {
    total: number;
  };
  restaurants: {
    total: number;
    active: number;
  };
  offers: {
    active: number;
  };
  coupons: {
    total: number;
    redeemed: number;
    expired: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (!loading && admin) {
      fetchStats();
    }
  }, [loading, admin]);

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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900">
              {statsLoading ? "-" : stats?.customers.total ?? 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Restaurants</p>
            <p className="text-3xl font-bold text-gray-900">
              {statsLoading ? "-" : stats?.restaurants.total ?? 0}
            </p>
            <p className="text-sm text-green-600 mt-1">
              {statsLoading ? "" : `${stats?.restaurants.active ?? 0} active`}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Active Offers</p>
            <p className="text-3xl font-bold text-gray-900">
              {statsLoading ? "-" : stats?.offers.active ?? 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Coupons Generated</p>
            <p className="text-3xl font-bold text-gray-900">
              {statsLoading ? "-" : stats?.coupons.total ?? 0}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Coupons Redeemed</p>
            <p className="text-3xl font-bold text-green-600">
              {statsLoading ? "-" : stats?.coupons.redeemed ?? 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Coupons Expired</p>
            <p className="text-3xl font-bold text-yellow-600">
              {statsLoading ? "-" : stats?.coupons.expired ?? 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Unused Coupons</p>
            <p className="text-3xl font-bold text-blue-600">
              {statsLoading
                ? "-"
                : (stats?.coupons.total ?? 0) -
                  (stats?.coupons.redeemed ?? 0) -
                  (stats?.coupons.expired ?? 0)}
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/admin/restaurants"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 border-indigo-500"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Manage Restaurants
            </h3>
            <p className="text-gray-600">
              Add, edit, or manage restaurant partners and their offers
            </p>
          </Link>

          <Link
            href="/admin/coupons"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 border-green-500"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Coupon Monitoring
            </h3>
            <p className="text-gray-600">
              View all coupons with filters and search
            </p>
          </Link>

          <Link
            href="/admin/restaurants/new"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 border-purple-500"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Add Restaurant
            </h3>
            <p className="text-gray-600">
              Create a new restaurant partner account
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
