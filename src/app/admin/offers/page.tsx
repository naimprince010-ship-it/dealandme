"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

interface Offer {
  id: string;
  restaurantId: string;
  restaurantName: string;
  area: string;
  title: string | null;
  discountType: "PERCENTAGE" | "FLAT" | null;
  discountValue: number | null;
  maxDiscountAmount: number | null;
  offerText: string;
  isActive: boolean;
  offPeakBoost: boolean;
  updatedAt: string;
}

export default function OffersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [total, setTotal] = useState(0);

  // Filters
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.authenticated || data.user?.type !== "ADMIN") {
          router.push("/admin/login");
          return;
        }

        fetchOffers();
      } catch {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!loading) {
      fetchOffers();
    }
  }, [selectedArea, selectedStatus]);

  const fetchOffers = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedArea) params.append("area", selectedArea);
      if (selectedStatus) params.append("status", selectedStatus);

      const res = await fetch(`/api/admin/offers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOffers(data.offers);
        setAreas(data.areas);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDiscount = (offer: Offer): string => {
    if (offer.discountType === "PERCENTAGE" && offer.discountValue) {
      return `${offer.discountValue}% off${offer.maxDiscountAmount ? ` (Up to ৳${offer.maxDiscountAmount})` : ""}`;
    }
    if (offer.discountType === "FLAT" && offer.discountValue) {
      return `৳${offer.discountValue} off`;
    }
    return offer.offerText || "-";
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Offers</h1>
            <p className="text-gray-500 mt-1">{total} offers found</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Area
              </label>
              <select
                id="area"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Areas</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            {(selectedArea || selectedStatus) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedArea("");
                    setSelectedStatus("");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Offers Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No offers found</p>
              {(selectedArea || selectedStatus) && (
                <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Offer Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Boost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {offers.map((offer) => (
                    <tr key={offer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900">{offer.restaurantName}</p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-gray-600">{offer.area}</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-gray-900 max-w-xs truncate">
                          {offer.title || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-purple-600 font-medium max-w-xs truncate">
                          {formatDiscount(offer)}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            offer.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {offer.isActive ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            offer.offPeakBoost
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {offer.offPeakBoost ? "ON" : "OFF"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-500">
                          {new Date(offer.updatedAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/restaurants/${offer.restaurantId}`}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
