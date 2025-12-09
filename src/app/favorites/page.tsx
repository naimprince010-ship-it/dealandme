"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";

interface FavoriteRestaurant {
  id: string;
  restaurantId: string;
  restaurant: {
    id: string;
    name: string;
    area: string;
    cuisine: string | null;
    description: string | null;
    offer: {
      id: string;
      offerText: string;
      isActive: boolean;
      photoUrl: string | null;
      discountType: string | null;
      discountValue: number | null;
    } | null;
  };
  createdAt: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteRestaurant[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push("/login");
          return;
        }

        const favRes = await fetch("/api/favorites");
        if (favRes.ok) {
          const data = await favRes.json();
          setFavorites(data.favorites || []);
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFavorites();
  }, [router]);

  const handleRemoveFavorite = async (restaurantId: string) => {
    setRemovingId(restaurantId);
    try {
      const res = await fetch("/api/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });

      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.restaurantId !== restaurantId));
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
    } finally {
      setRemovingId(null);
    }
  };

  const getDiscountBadge = (discountType: string | null, discountValue: number | null) => {
    if (!discountValue) return null;
    if (discountType === "PERCENTAGE") {
      return language === "bn" ? `${discountValue}% ছাড়` : `${discountValue}% OFF`;
    }
    return language === "bn" ? `৳${discountValue} ছাড়` : `৳${discountValue} OFF`;
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

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
    }}>
      <LoginBackgroundPattern />
      
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" ? "পছন্দের তালিকা" : "Favorites"}
          </h1>
        </div>

        {/* Content */}
        {favorites.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-6">
            {/* Illustration - Heart with plate */}
            <div className="relative mb-8">
              <div className="w-40 h-40 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center">
                <div className="relative">
                  {/* Plate */}
                  <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-100">
                    <span className="text-5xl">🍽️</span>
                  </div>
                  {/* Heart */}
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-4 h-4 bg-emerald-300 rounded-full opacity-60"></div>
              <div className="absolute bottom-4 right-0 w-3 h-3 bg-amber-300 rounded-full opacity-60"></div>
              <div className="absolute top-8 right-2 w-2 h-2 bg-rose-300 rounded-full opacity-60"></div>
            </div>

            {/* Message */}
            <h2 className="text-xl font-bold text-gray-800 mb-2 text-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "এখনও কোনো পছন্দ নেই?" : "No favorites yet?"}
            </h2>
            <p className="text-gray-500 text-center mb-8" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "সেরা ডিলগুলো মিস করবেন না!" : "Don't miss out on the best deals!"}
            </p>

            {/* Action Button */}
            <Link
              href="/"
              className="px-8 py-3.5 rounded-xl font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
              style={{
                background: "linear-gradient(135deg, #5BA88B 0%, #4A9A7C 100%)",
                fontFamily: "var(--font-bangla), sans-serif"
              }}
            >
              {language === "bn" ? "রেস্টুরেন্ট খুঁজুন" : "Explore Restaurants"}
            </Link>
          </div>
        ) : (
          /* Filled State - Vertical Card List */
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="flex">
                  {/* Restaurant Image */}
                  <div className="w-28 h-28 flex-shrink-0 relative">
                    {favorite.restaurant.offer?.photoUrl ? (
                      <img
                        src={favorite.restaurant.offer.photoUrl}
                        alt={favorite.restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                    {/* Discount Badge */}
                    {favorite.restaurant.offer?.discountValue && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        {getDiscountBadge(favorite.restaurant.offer.discountType, favorite.restaurant.offer.discountValue)}
                      </div>
                    )}
                  </div>

                  {/* Restaurant Info */}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-bold text-gray-800 text-base leading-tight" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                          {favorite.restaurant.name}
                        </h3>
                        {/* Heart Icon - Tap to unfavorite */}
                        <button
                          onClick={() => handleRemoveFavorite(favorite.restaurantId)}
                          disabled={removingId === favorite.restaurantId}
                          className="ml-2 flex-shrink-0 transition-transform active:scale-90"
                        >
                          {removingId === favorite.restaurantId ? (
                            <div className="w-6 h-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent"></div>
                          ) : (
                            <svg className="w-6 h-6 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {favorite.restaurant.cuisine || favorite.restaurant.area}
                      </p>
                      {/* Rating - Static for now */}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-amber-400 text-sm">★</span>
                        <span className="text-sm text-gray-600">4.5</span>
                      </div>
                    </div>

                    {/* View Deal Button */}
                    <Link
                      href={`/restaurants/${favorite.restaurant.id}`}
                      className="mt-2 inline-flex items-center justify-center px-4 py-1.5 border-2 border-emerald-500 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
                      style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                    >
                      {language === "bn" ? "ডিল দেখুন" : "View Deal"}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
