"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Customer {
  id: string;
  phone: string;
  type: string;
}

export default function RestaurantsPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.authenticated || data.user?.type !== "CUSTOMER") {
          router.push("/login");
          return;
        }

        setCustomer(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
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
      <header className="bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            Dealbox
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/coupons"
              className="text-indigo-100 hover:text-white"
            >
              My Coupons
            </Link>
            <button
              onClick={handleLogout}
              className="text-indigo-100 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Browse Restaurants
        </h2>

        <div className="bg-yellow-50 p-6 rounded-xl mb-8">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            MVP Note
          </h3>
          <p className="text-yellow-700">
            Welcome, {customer?.phone}! This is the Milestone 1 foundation. 
            Full restaurant browsing and coupon generation will be implemented in Milestone 2.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Spice Garden
            </h3>
            <p className="text-sm text-indigo-600 mb-2">Koramangala</p>
            <p className="text-gray-600 mb-4">
              Authentic Indian cuisine with a modern twist
            </p>
            <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
              20% off on all dine-in orders
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pizza Paradise
            </h3>
            <p className="text-sm text-indigo-600 mb-2">Indiranagar</p>
            <p className="text-gray-600 mb-4">
              Wood-fired pizzas and Italian delights
            </p>
            <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
              Buy 1 Get 1 Free on all pizzas
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cafe Mocha
            </h3>
            <p className="text-sm text-indigo-600 mb-2">HSR Layout</p>
            <p className="text-gray-600 mb-4">
              Cozy cafe with specialty coffees and desserts
            </p>
            <div className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm">
              Free dessert with any coffee order
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
