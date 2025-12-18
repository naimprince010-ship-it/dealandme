"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import CouponUsageGuide from "@/components/CouponUsageGuide";
import BottomNav from "@/components/BottomNav";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";
import { useLanguage } from "@/lib/LanguageContext";

interface Restaurant {
  id: string;
  name: string;
  area: string;
  description: string | null;
  coverImage: string | null;
  coverImagePosition: string | null;
  offer: {
    id: string;
    offerText: string;
    isActive: boolean;
    photoUrl?: string | null;
    discountType?: string | null;
    discountValue?: number | null;
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
  const { language } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push(`/login?redirect=/restaurants/${id}`);
          return;
        }

        const [restaurantRes, favoritesRes] = await Promise.all([
          fetch(`/api/restaurants/${id}`),
          fetch("/api/favorites"),
        ]);

        const restaurantData = await restaurantRes.json();
        if (!restaurantRes.ok) {
          throw new Error(restaurantData.error || "Failed to fetch restaurant");
        }
        setRestaurant(restaurantData.restaurant);

        if (favoritesRes.ok) {
          const favoritesData = await favoritesRes.json();
          const favIds = new Set<string>(
            favoritesData.favorites?.map((f: { restaurantId: string }) => f.restaurantId) || []
          );
          setIsFavorite(favIds.has(id));
        }

        fetch("/api/visit-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId: id }),
        }).catch(() => {});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  const toggleFavorite = async () => {
    const newValue = !isFavorite;
    setIsFavorite(newValue);

    try {
      const res = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: id }),
      });

      if (!res.ok) {
        setIsFavorite(!newValue);
      }
    } catch {
      setIsFavorite(!newValue);
    }
  };

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

    if (diff <= 0) return language === "bn" ? "মেয়াদোত্তীর্ণ" : "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return language === "bn" ? `${hours} ঘন্টা ${minutes} মিনিট বাকি` : `Expires in ${hours}h ${minutes}m`;
    }
    return language === "bn" ? `${minutes} মিনিট বাকি` : `Expires in ${minutes}m`;
  };

  const getDiscountBadge = () => {
    if (!restaurant?.offer?.discountValue) return null;
    if (restaurant.offer.discountType === "PERCENTAGE") {
      return language === "bn" ? `${restaurant.offer.discountValue}% ছাড়` : `${restaurant.offer.discountValue}% OFF`;
    }
    return language === "bn" ? `৳${restaurant.offer.discountValue} ছাড়` : `৳${restaurant.offer.discountValue} OFF`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="min-h-screen pb-24 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
      }}>
        <LoginBackgroundPattern />
        <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">😕</span>
            </div>
            <p className="text-rose-500 mb-4 text-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>{error}</p>
            <Link 
              href="/restaurants" 
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              style={{ fontFamily: "var(--font-bangla), sans-serif" }}
            >
              {language === "bn" ? "রেস্টুরেন্ট খুঁজুন" : "Back to restaurants"}
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen pb-24 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
      }}>
        <LoginBackgroundPattern />
        <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🍽️</span>
            </div>
            <p className="text-gray-500 mb-4 text-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "রেস্টুরেন্ট পাওয়া যায়নি" : "Restaurant not found"}
            </p>
            <Link 
              href="/restaurants" 
              className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              style={{ fontFamily: "var(--font-bangla), sans-serif" }}
            >
              {language === "bn" ? "রেস্টুরেন্ট খুঁজুন" : "Back to restaurants"}
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
    }}>
      <LoginBackgroundPattern />
      
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={toggleFavorite}
            className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm transition-transform active:scale-90"
          >
            <svg className={`w-6 h-6 ${isFavorite ? "text-rose-500" : "text-gray-400"}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>

        {/* Restaurant Hero Image */}
        <div className="relative rounded-2xl overflow-hidden mb-4 shadow-lg">
                    {restaurant.coverImage || restaurant.offer?.photoUrl ? (
                      <img
                        src={restaurant.coverImage || restaurant.offer?.photoUrl || ""}
                        alt={restaurant.name}
                        className="w-full h-48 object-cover"
                        style={{ objectPosition: restaurant.coverImagePosition || "center" }}
                      />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          {/* Discount Badge */}
          {getDiscountBadge() && (
            <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
              {getDiscountBadge()}
            </div>
          )}
        </div>

        {/* Restaurant Info Card */}
        <div className="bg-white/95 rounded-2xl shadow-sm p-5 mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {restaurant.name}
              </h1>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  📍 {restaurant.area}
                </span>
              </p>
            </div>
          </div>

          {restaurant.description && (
            <p className="text-gray-600 text-sm mb-4" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {restaurant.description}
            </p>
          )}

          {/* Current Offer */}
          {restaurant.offer && restaurant.offer.isActive ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <h2 className="text-base font-bold text-emerald-700 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {language === "bn" ? "বর্তমান অফার" : "Current Offer"}
              </h2>
              <p className="text-emerald-600" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                🎁 {restaurant.offer.offerText}
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-amber-700 text-sm" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {language === "bn" ? "এই রেস্টুরেন্টে বর্তমানে কোনো অফার নেই।" : "This restaurant currently has no active offer."}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl mb-4 text-sm" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {error}
            </div>
          )}

          {/* Coupon Display or Get Coupon Button */}
          {coupon ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
              {couponMessage && (
                <p className="text-emerald-600 mb-3 font-medium text-sm" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                  {couponMessage}
                </p>
              )}
              <h3 className="text-base font-bold text-gray-700 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {language === "bn" ? "আপনার কুপন কোড" : "Your Coupon Code"}
              </h3>
              <div className="bg-white border-2 border-dashed border-emerald-400 rounded-xl p-4 mb-3">
                <p className="text-3xl font-mono font-bold text-emerald-600 tracking-wider">
                  {coupon.code}
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {language === "bn" ? "রেস্টুরেন্টে এই কোড দেখান" : "Show this code at the restaurant"}
              </p>
              <p className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full inline-block">
                {formatExpiry(coupon.expiresAt)}
              </p>
            </div>
          ) : (
            restaurant.offer?.isActive && (
              <button
                onClick={handleGetCoupon}
                disabled={generating}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #5BA88B 0%, #4A9A7C 100%)",
                  fontFamily: "var(--font-bangla), sans-serif"
                }}
              >
                {generating ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                    {language === "bn" ? "তৈরি হচ্ছে..." : "Generating..."}
                  </span>
                ) : (
                  language === "bn" ? "কুপন নিন" : "Get Coupon"
                )}
              </button>
            )
          )}
        </div>
        
        {/* Coupon Usage Guide */}
        <div className="bg-white/95 rounded-2xl shadow-sm overflow-hidden mb-4">
          <CouponUsageGuide />
        </div>

        {/* Browse More Link */}
        <div className="text-center py-4">
          <Link 
            href="/restaurants" 
            className="text-emerald-600 font-medium hover:underline"
            style={{ fontFamily: "var(--font-bangla), sans-serif" }}
          >
            {language === "bn" ? "আরো রেস্টুরেন্ট দেখুন" : "Browse more restaurants"}
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
