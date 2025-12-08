"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import CustomerNav from "@/components/CustomerNav";
import CouponUsageGuide from "@/components/CouponUsageGuide";
import { useLanguage } from "@/lib/LanguageContext";

interface Restaurant {
  id: string;
  name: string;
  area: string;
  description: string | null;
  offer: {
    id: string;
    offerText: string;
    isActive: boolean;
  } | null;
}

interface Coupon {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  restaurant: {
    name: string;
    area: string;
  };
  offer: {
    offerText: string;
  };
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { t } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [couponMessage, setCouponMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        // Check auth first
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push(`/login?redirect=/restaurants/${id}`);
          return;
        }

        // Fetch restaurant details
        const res = await fetch(`/api/restaurants/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch restaurant");
        }

        setRestaurant(data.restaurant);

        // Record visit to this restaurant (fire and forget)
        fetch("/api/visit-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId: id }),
        }).catch(() => {
          // Silently ignore errors for visit tracking
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  const handleGetCoupon = async () => {
    setGenerating(true);
    setCouponMessage("");
    setError("");

    try {
      const res = await fetch("/api/coupons/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ restaurantId: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate coupon");
      }

      setCoupon(data.coupon);
      if (data.isExisting) {
        setCouponMessage("You already have an active coupon for this restaurant");
      } else {
        setCouponMessage("Coupon generated successfully!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate coupon");
    } finally {
      setGenerating(false);
    }
  };

  const formatExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Expires in ${hours}h ${minutes}m`;
    }
    return `Expires in ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/restaurants" className="text-orange-500 hover:underline">
            Back to restaurants
          </Link>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Restaurant not found</p>
          <Link href="/restaurants" className="text-orange-500 hover:underline">
            Back to restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Link href="/restaurants" className="inline-flex items-center text-gray-600 hover:text-indigo-600 mb-4">
          <span className="mr-2">←</span> Back to restaurants
        </Link>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{restaurant.name}</h1>
              <p className="text-gray-500 flex items-center">
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm">
                  📍 {restaurant.area}
                </span>
              </p>
            </div>
          </div>

          {restaurant.description && (
            <p className="text-gray-600 mb-6">{restaurant.description}</p>
          )}

          {restaurant.offer && restaurant.offer.isActive ? (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-indigo-700 mb-2">Current Offer</h2>
              <p className="text-indigo-600 text-lg">🎁 {restaurant.offer.offerText}</p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-amber-700">This restaurant currently has no active offer.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {coupon ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              {couponMessage && (
                <p className="text-green-600 mb-4 font-medium">{couponMessage}</p>
              )}
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t("restaurantDetail", "yourCouponCode")}</h3>
              <div className="bg-white border-2 border-dashed border-green-400 rounded-lg p-4 mb-4">
                <p className="text-3xl font-mono font-bold text-green-600 tracking-wider">
                  {coupon.code}
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-2">
                {t("restaurantDetail", "showCodeToStaff")}
              </p>
              <p className="text-sm font-medium text-indigo-600">
                {formatExpiry(coupon.expiresAt)}
              </p>
            </div>
          ) : (
            restaurant.offer?.isActive && (
              <button
                onClick={handleGetCoupon}
                disabled={generating}
                className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    {t("restaurantDetail", "generating")}
                  </span>
                ) : (
                  t("restaurantDetail", "getCoupon")
                )}
              </button>
            )
          )}
          
          <div className="mt-6">
            <CouponUsageGuide />
          </div>
        </div>

        <div className="text-center">
          <Link href="/restaurants" className="text-indigo-600 hover:underline">
            {t("restaurantDetail", "browseMore")}
          </Link>
        </div>
      </main>
    </div>
  );
}
