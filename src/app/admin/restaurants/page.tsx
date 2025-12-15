"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

function DeleteConfirmModal({
  restaurant,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  restaurant: Restaurant;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Deactivate Restaurant?
        </h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to deactivate <strong>{restaurant.name}</strong>? 
          The restaurant will be hidden from customers but data will be preserved.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deactivating..." : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [deleteTarget, setDeleteTarget] = useState<Restaurant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${deleteTarget.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        setRestaurants(restaurants.map(r => 
          r.id === deleteTarget.id ? { ...r, isActive: false } : r
        ));
        setDeleteTarget(null);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to deactivate restaurant");
      }
    } catch {
      setError("Failed to deactivate restaurant");
    } finally {
      setIsDeleting(false);
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
                        <div className="flex gap-3">
                          <Link
                            href={`/admin/restaurants/${restaurant.id}`}
                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Edit
                          </Link>
                          {restaurant.isActive && (
                            <button
                              onClick={() => setDeleteTarget(restaurant)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {deleteTarget && (
        <DeleteConfirmModal
          restaurant={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
