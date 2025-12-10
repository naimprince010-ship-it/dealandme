"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { useLanguage } from "@/lib/LanguageContext";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";

interface Restaurant {
  id: string;
  name: string;
  area: string;
  cuisine?: string | null;
  description: string | null;
  offer: {
    id: string;
    offerText: string;
    photoUrl?: string | null;
    discountType?: string | null;
    discountValue?: number | null;
  } | null;
}

interface RecentlyVisited {
  id: string;
  name: string;
  area: string;
  cuisine?: string | null;
  offer: { offerText: string; isActive: boolean; photoUrl?: string | null } | null;
  visitedAt: string;
}

interface Recommendation {
  id: string;
  name: string;
  area: string;
  cuisine?: string | null;
  offer: { offerText: string; isActive: boolean; photoUrl?: string | null } | null;
  score: number;
  isFavorite: boolean;
  recentlyVisited: boolean;
}

interface GroupedRestaurants {
  [area: string]: Restaurant[];
}

// Available areas for filtering
const AREAS = [
  { id: "all", en: "All Areas", bn: "সব এলাকা" },
  { id: "Dhanmondi", en: "Dhanmondi", bn: "ধানমন্ডি" },
  { id: "Banani", en: "Banani", bn: "বনানী" },
  { id: "Uttara", en: "Uttara", bn: "উত্তরা" },
  { id: "Gulshan", en: "Gulshan", bn: "গুলশান" },
  { id: "Mirpur", en: "Mirpur", bn: "মিরপুর" },
  { id: "Mohammadpur", en: "Mohammadpur", bn: "মোহাম্মদপুর" },
];

export default function RestaurantsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [groupedRestaurants, setGroupedRestaurants] = useState<GroupedRestaurants>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedArea, setSelectedArea] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentlyVisited, setRecentlyVisited] = useState<RecentlyVisited[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        // Check auth first
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push("/login");
          return;
        }

        // Fetch restaurants, favorites, recently visited, and recommendations in parallel
        const [restaurantsRes, favoritesRes, visitHistoryRes, recommendationsRes] = await Promise.all([
          fetch("/api/restaurants"),
          fetch("/api/favorites"),
          fetch("/api/visit-history"),
          fetch("/api/recommendations"),
        ]);

        const restaurantsData = await restaurantsRes.json();
        if (!restaurantsRes.ok) {
          throw new Error(restaurantsData.error || "Failed to fetch restaurants");
        }
        setGroupedRestaurants(restaurantsData.groupedByArea || {});

        // Set favorites
        if (favoritesRes.ok) {
          const favoritesData = await favoritesRes.json();
          const favIds = new Set<string>(
            favoritesData.favorites?.map((f: { restaurantId: string }) => f.restaurantId) || []
          );
          setFavorites(favIds);
        }

        // Set recently visited
        if (visitHistoryRes.ok) {
          const visitData = await visitHistoryRes.json();
          setRecentlyVisited(visitData.recentlyVisited || []);
        }

        // Set recommendations
        if (recommendationsRes.ok) {
          const recData = await recommendationsRes.json();
          setRecommendations(recData.recommendations || []);
          // Show recommendations section if user has some history
          if (recData.recommendations?.length > 0 && recData.preferences?.totalVisits > 0) {
            setShowRecommendations(true);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const toggleFavorite = async (restaurantId: string) => {
    const isFavorite = favorites.has(restaurantId);
    
    // Optimistic update
    const newFavorites = new Set(favorites);
    if (isFavorite) {
      newFavorites.delete(restaurantId);
    } else {
      newFavorites.add(restaurantId);
    }
    setFavorites(newFavorites);

    try {
      const res = await fetch("/api/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId }),
      });

      if (!res.ok) {
        // Revert on error
        setFavorites(favorites);
      }
    } catch {
      // Revert on error
      setFavorites(favorites);
    }
  };

  // Filter restaurants by selected area
  const filteredAreas = selectedArea === "all" 
    ? Object.keys(groupedRestaurants)
    : Object.keys(groupedRestaurants).filter(area => area === selectedArea);

  const getDiscountBadge = (discountType: string | null | undefined, discountValue: number | null | undefined) => {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
      }}>
        <div className="text-center">
          <p className="text-rose-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            style={{ fontFamily: "var(--font-bangla), sans-serif" }}
          >
            {language === "bn" ? "আবার চেষ্টা করুন" : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  const areas = Object.keys(groupedRestaurants);

  if (areas.length === 0) {
    return (
      <div className="min-h-screen pb-24 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
      }}>
        <LoginBackgroundPattern />
        <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
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
              {language === "bn" ? "রেস্টুরেন্ট খুঁজুন" : "Search Restaurants"}
            </h1>
          </div>
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="relative mb-8">
              <div className="w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-100">
                  <span className="text-5xl">🍽️</span>
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 text-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "কোনো রেস্টুরেন্ট নেই" : "No restaurants yet"}
            </h2>
            <p className="text-gray-500 text-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "পরে আবার দেখুন!" : "Check back later for exciting deals!"}
            </p>
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
            {language === "bn" ? "রেস্টুরেন্ট খুঁজুন" : "Search Restaurants"}
          </h1>
        </div>

        {/* Area Selection Filter */}
        <div className="mb-6 overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-2">
            {AREAS.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  selectedArea === area.id
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-white/80 text-gray-600 hover:bg-white"
                }`}
                style={{ fontFamily: "var(--font-bangla), sans-serif" }}
              >
                {language === "bn" ? area.bn : area.en}
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations Section */}
        {showRecommendations && recommendations.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm mr-2">
                {language === "bn" ? "🎯 আপনার জন্য" : "🎯 For You"}
              </span>
            </h2>
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                {recommendations.slice(0, 6).map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/restaurants/${restaurant.id}`}
                    className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-44 flex-shrink-0"
                  >
                    <div className="h-24 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
                      {restaurant.offer?.photoUrl ? (
                        <img src={restaurant.offer.photoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl">🍽️</span>
                      )}
                      {restaurant.isFavorite && (
                        <span className="absolute top-2 right-2 text-lg">❤️</span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-gray-800 text-sm leading-tight" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                        {restaurant.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{restaurant.area}</p>
                      {restaurant.offer && restaurant.offer.isActive && (
                        <div className="mt-2 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs truncate">
                          🎁 {restaurant.offer.offerText}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recently Visited Section */}
        {recentlyVisited.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm mr-2">
                {language === "bn" ? "🕐 সম্প্রতি দেখেছেন" : "🕐 Recently Visited"}
              </span>
            </h2>
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <div className="flex gap-3" style={{ minWidth: "max-content" }}>
                {recentlyVisited.slice(0, 6).map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/restaurants/${restaurant.id}`}
                    className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-40 flex-shrink-0"
                  >
                    <div className="h-20 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      {restaurant.offer?.photoUrl ? (
                        <img src={restaurant.offer.photoUrl} alt={restaurant.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">🍽️</span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-bold text-gray-800 text-sm leading-tight truncate" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                        {restaurant.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{restaurant.area}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Restaurant List */}
        {filteredAreas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🔍</span>
            </div>
            <p className="text-gray-500 text-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "এই এলাকায় কোনো রেস্টুরেন্ট নেই" : "No restaurants in this area"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAreas.map((area) => (
              <section key={area}>
                <h2 className="text-sm font-bold text-gray-600 mb-3 flex items-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs">
                    📍 {area}
                  </span>
                </h2>
                <div className="space-y-3">
                  {groupedRestaurants[area].map((restaurant) => (
                    <div
                      key={restaurant.id}
                      className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="flex">
                        {/* Restaurant Image */}
                        <div className="w-28 h-28 flex-shrink-0 relative">
                          {restaurant.offer?.photoUrl ? (
                            <img
                              src={restaurant.offer.photoUrl}
                              alt={restaurant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <span className="text-4xl">🍽️</span>
                            </div>
                          )}
                          {/* Discount Badge */}
                          {restaurant.offer?.discountValue && (
                            <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                              {getDiscountBadge(restaurant.offer.discountType, restaurant.offer.discountValue)}
                            </div>
                          )}
                        </div>

                        {/* Restaurant Info */}
                        <div className="flex-1 p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between">
                              <h3 className="font-bold text-gray-800 text-base leading-tight" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                                {restaurant.name}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleFavorite(restaurant.id);
                                }}
                                className="ml-2 flex-shrink-0 transition-transform active:scale-90"
                              >
                                <svg className={`w-6 h-6 ${favorites.has(restaurant.id) ? "text-rose-500" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                </svg>
                              </button>
                            </div>
                            {restaurant.offer && (
                              <div className="mt-2 bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded-lg text-xs" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                                🎁 {restaurant.offer.offerText}
                              </div>
                            )}
                          </div>

                          {/* View Offer Button */}
                          <Link
                            href={`/restaurants/${restaurant.id}`}
                            className="mt-2 inline-flex items-center justify-center px-4 py-1.5 border-2 border-emerald-500 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
                            style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                          >
                            {language === "bn" ? "অফার দেখুন" : "View Offer"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
