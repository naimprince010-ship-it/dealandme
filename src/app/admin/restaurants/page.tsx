"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

interface Offer {
  id: string;
  offerText: string;
  isActive: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  area: string;
  description: string | null;
  username: string;
  isActive: boolean;
  offer: Offer | null;
  createdAt: string;
}

export default function AdminRestaurants() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.authenticated || data.user?.type !== "ADMIN") {
          router.push("/admin/login");
          return;
        }

        fetchRestaurants();
      } catch {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch("/api/admin/restaurants");
      if (res.ok) {
        const data = await res.json();
        setRestaurants(data.restaurants);
      } else {
        setError("Failed to fetch restaurants");
      }
    } catch {
      setError("Failed to fetch restaurants");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Restaurants</h1>
          <Link
            href="/admin/restaurants/new"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Add Restaurant
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Offer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {restaurants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No restaurants found. Add your first restaurant to get started.
                    </td>
                  </tr>
                ) : (
                  restaurants.map((restaurant) => (
                    <tr key={restaurant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {restaurant.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{restaurant.username}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {restaurant.area}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            restaurant.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {restaurant.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {restaurant.offer ? (
                          <div>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                restaurant.offer.isActive
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {restaurant.offer.isActive ? "Active" : "Inactive"}
                            </span>
                            <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">
                              {restaurant.offer.offerText}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No offer</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/restaurants/${restaurant.id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
