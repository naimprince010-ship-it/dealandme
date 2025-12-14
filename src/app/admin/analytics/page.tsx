"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

interface Analytics {
  customers: {
    total: number;
    active: number;
    inactive: number;
    online: number;
    appInstalls: number;
  };
  restaurants: {
    total: number;
    active: number;
    inactive: number;
    online: number;
    appInstalls: number;
  };
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAuthAndFetch() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();
        if (!authData.authenticated || authData.user?.type !== "ADMIN") {
          router.push("/admin/login");
          return;
        }

        const analyticsRes = await fetch("/api/admin/analytics");
        if (analyticsRes.ok) {
          const data = await analyticsRes.json();
          setAnalytics(data);
        } else {
          setError("Failed to fetch analytics");
        }
      } catch {
        setError("Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    }
    checkAuthAndFetch();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Analytics Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Customer Analytics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-blue-600">{analytics?.customers.total || 0}</p>
                <p className="text-sm text-gray-600">Total Customers</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-green-600">{analytics?.customers.active || 0}</p>
                <p className="text-sm text-gray-600">Active (30 days)</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-yellow-600">{analytics?.customers.inactive || 0}</p>
                <p className="text-sm text-gray-600">Inactive</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-emerald-600">{analytics?.customers.online || 0}</p>
                <p className="text-sm text-gray-600">Online (5 min)</p>
              </div>
            </div>
            <div className="mt-4 bg-purple-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-purple-600">{analytics?.customers.appInstalls || 0}</p>
              <p className="text-sm text-gray-600">Customer App Installs</p>
            </div>
          </div>

          {/* Restaurant Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              Restaurant Analytics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-blue-600">{analytics?.restaurants.total || 0}</p>
                <p className="text-sm text-gray-600">Total Restaurants</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-green-600">{analytics?.restaurants.active || 0}</p>
                <p className="text-sm text-gray-600">Active (30 days)</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-yellow-600">{analytics?.restaurants.inactive || 0}</p>
                <p className="text-sm text-gray-600">Inactive</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-emerald-600">{analytics?.restaurants.online || 0}</p>
                <p className="text-sm text-gray-600">Online (5 min)</p>
              </div>
            </div>
            <div className="mt-4 bg-orange-50 rounded-xl p-4">
              <p className="text-3xl font-bold text-orange-600">{analytics?.restaurants.appInstalls || 0}</p>
              <p className="text-sm text-gray-600">Restaurant App Installs</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="text-3xl font-bold">
              {(analytics?.customers.total || 0) + (analytics?.restaurants.total || 0)}
            </p>
            <p className="text-sm opacity-90">Total Users</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <p className="text-3xl font-bold">
              {(analytics?.customers.active || 0) + (analytics?.restaurants.active || 0)}
            </p>
            <p className="text-sm opacity-90">Total Active</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
            <p className="text-3xl font-bold">
              {(analytics?.customers.online || 0) + (analytics?.restaurants.online || 0)}
            </p>
            <p className="text-sm opacity-90">Total Online</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-3xl font-bold">
              {(analytics?.customers.appInstalls || 0) + (analytics?.restaurants.appInstalls || 0)}
            </p>
            <p className="text-sm opacity-90">Total App Installs</p>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <h3 className="font-medium text-blue-800 mb-2">How Analytics Work</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li><strong>Active:</strong> Users who logged in within the last 30 days</li>
            <li><strong>Inactive:</strong> Users who haven&apos;t logged in for more than 30 days</li>
            <li><strong>Online:</strong> Users who were active in the last 5 minutes</li>
            <li><strong>App Installs:</strong> PWA installations tracked when users install the app</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
