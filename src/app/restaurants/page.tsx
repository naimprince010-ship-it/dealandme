"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CustomerNav from "@/components/CustomerNav";

interface Restaurant {
  id: string;
  name: string;
  area: string;
  description: string | null;
  offer: {
    id: string;
    offerText: string;
  } | null;
}

interface GroupedRestaurants {
  [area: string]: Restaurant[];
}

export default function RestaurantsPage() {
  const router = useRouter();
  const [groupedRestaurants, setGroupedRestaurants] = useState<GroupedRestaurants>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRestaurants() {
      try {
        // Check auth first
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push("/login");
          return;
        }

        // Fetch restaurants
        const res = await fetch("/api/restaurants");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch restaurants");
        }

        setGroupedRestaurants(data.groupedByArea || {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchRestaurants();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-indigo-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const areas = Object.keys(groupedRestaurants);

  if (areas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNav />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Restaurants & Offers</h1>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No restaurants available
            </h2>
            <p className="text-gray-500">
              Check back later for exciting deals from local restaurants!
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Restaurants & Offers
        </h1>

        {areas.map((area) => (
          <section key={area} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm mr-2">
                📍 {area}
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {groupedRestaurants[area].map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {restaurant.name}
                    </h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                      {restaurant.area}
                    </span>
                  </div>
                  {restaurant.offer && (
                    <div className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm mb-4 flex items-center">
                      <span className="mr-2">🎁</span>
                      <span className="font-medium">{restaurant.offer.offerText}</span>
                    </div>
                  )}
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    className="inline-block w-full text-center bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    View Offer
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
