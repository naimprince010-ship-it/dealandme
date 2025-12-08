"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Restaurant {
  id: string;
  name: string;
  area: string;
  type: string;
}

export default function RestaurantDashboard() {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.authenticated || data.user?.type !== "RESTAURANT") {
          router.push("/restaurant/login");
          return;
        }

        setRestaurant(data.user);
      } catch {
        router.push("/restaurant/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/restaurant/login");
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
            <p className="text-sm text-gray-500">Restaurant Partner</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{restaurant?.name}</span>
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

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/restaurant/validate"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Validate Coupon
            </h3>
            <p className="text-gray-600">
              Enter a coupon code to validate and redeem
            </p>
          </Link>

          <Link
            href="/restaurant/history"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Redemption History
            </h3>
            <p className="text-gray-600">
              View all redeemed coupons and their details
            </p>
          </Link>
        </div>

        <div className="mt-8 bg-indigo-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">
            Quick Tip
          </h3>
          <p className="text-indigo-700">
            When a customer shows you their coupon code, use the &quot;Validate Coupon&quot;
            feature to verify and mark it as used. Each coupon can only be used once.
          </p>
        </div>
      </main>
    </div>
  );
}
