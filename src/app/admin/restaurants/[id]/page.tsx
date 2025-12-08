"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditRestaurant() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    area: "",
    description: "",
    isActive: true,
    newPassword: "",
  });

  const [offerData, setOfferData] = useState({
    offerText: "",
    isActive: true,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.authenticated || data.user?.type !== "ADMIN") {
          router.push("/admin/login");
          return;
        }

        fetchRestaurant();
      } catch {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router, id]);

  const fetchRestaurant = async () => {
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRestaurant(data.restaurant);
        setFormData({
          name: data.restaurant.name,
          area: data.restaurant.area,
          description: data.restaurant.description || "",
          isActive: data.restaurant.isActive,
          newPassword: "",
        });
        if (data.restaurant.offer) {
          setOfferData({
            offerText: data.restaurant.offer.offerText,
            isActive: data.restaurant.offer.isActive,
          });
        }
      } else {
        setError("Restaurant not found");
      }
    } catch {
      setError("Failed to fetch restaurant");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update restaurant");
        return;
      }

      setSuccess("Restaurant updated successfully!");
      setFormData({ ...formData, newPassword: "" });
      fetchRestaurant();
    } catch {
      setError("Failed to update restaurant");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/restaurants/${id}/offer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update offer");
        return;
      }

      setSuccess("Offer updated successfully!");
      fetchRestaurant();
    } catch {
      setError("Failed to update offer");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Restaurant not found</p>
          <Link href="/admin/restaurants" className="text-purple-600 hover:text-purple-800">
            Back to Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Edit Restaurant: {restaurant.name}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Details</h3>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                Area *
              </label>
              <input
                type="text"
                id="area"
                required
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Restaurant is active
              </label>
            </div>

            <hr className="border-gray-200" />

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Reset Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Leave empty to keep current password"
              />
              <p className="text-sm text-gray-500 mt-1">
                Username: <span className="font-mono">{restaurant.username}</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Saving..." : "Save Restaurant Details"}
            </button>
          </div>
        </form>

        <form onSubmit={handleOfferSubmit} className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Management</h3>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="offerText" className="block text-sm font-medium text-gray-700 mb-1">
                Offer Text *
              </label>
              <textarea
                id="offerText"
                rows={2}
                required
                value={offerData.offerText}
                onChange={(e) => setOfferData({ ...offerData, offerText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., 20% off on all items"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="offerIsActive"
                checked={offerData.isActive}
                onChange={(e) => setOfferData({ ...offerData, isActive: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="offerIsActive" className="text-sm font-medium text-gray-700">
                Offer is active
              </label>
            </div>

            {!offerData.isActive && (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                When the offer is inactive, customers will not see this restaurant or be able to generate coupons.
              </p>
            )}
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Saving..." : restaurant.offer ? "Update Offer" : "Create Offer"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
