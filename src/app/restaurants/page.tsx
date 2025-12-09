"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import { useLanguage } from "@/lib/LanguageContext";

interface Restaurant {
  id: string;
  name: string;
  area: string;
  cuisine?: string | null;
  description: string | null;
  offer: {
    id: string;
    offerText: string;
  } | null;
}

interface RecentlyVisited {
  id: string;
  name: string;
  area: string;
  cuisine?: string | null;
  offer: { offerText: string; isActive: boolean } | null;
  visitedAt: string;
}

interface Recommendation {
  id: string;
  name: string;
  area: string;
  cuisine?: string | null;
  offer: { offerText: string; isActive: boolean } | null;
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
  const { language, t } = useLanguage();
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
        <div className="min-h-screen bg-gray-50 pb-20">
          <main className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">{t("restaurants", "browseTitle")}</h1>
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🍽️</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {t("restaurants", "noRestaurants")}
              </h2>
              <p className="text-gray-500">
                {language === "bn" ? "পরে আবার দেখুন!" : "Check back later for exciting deals!"}
              </p>
            </div>
          </main>
          <BottomNav />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {t("restaurants", "browseTitle")}
        </h1>

        {/* Recommendations Section */}
        {showRecommendations && recommendations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm mr-2">
                {language === "bn" ? "🎯 আপনার জন্য" : "🎯 For You"}
              </span>
            </h2>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4" style={{ minWidth: "max-content" }}>
                {recommendations.slice(0, 6).map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/restaurants/${restaurant.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow w-64 flex-shrink-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {restaurant.name}
                      </h3>
                      {restaurant.isFavorite && <span className="text-lg">❤️</span>}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">📍 {restaurant.area}</p>
                    {restaurant.cuisine && (
                      <p className="text-xs text-purple-600 mb-2">🍽️ {restaurant.cuisine}</p>
                    )}
                    {restaurant.offer && restaurant.offer.isActive && (
                      <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs">
                        🎁 {restaurant.offer.offerText}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Recently Visited Section */}
        {recentlyVisited.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm mr-2">
                {language === "bn" ? "🕐 সম্প্রতি দেখেছেন" : "🕐 Recently Visited"}
              </span>
            </h2>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4" style={{ minWidth: "max-content" }}>
                {recentlyVisited.slice(0, 6).map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={`/restaurants/${restaurant.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow w-56 flex-shrink-0"
                  >
                    <h3 className="font-semibold text-gray-800 mb-1">
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">📍 {restaurant.area}</p>
                    {restaurant.offer && restaurant.offer.isActive && (
                      <div className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs">
                        🎁 {restaurant.offer.offerText}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Area Selection Filter */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {AREAS.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedArea === area.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {language === "bn" ? area.bn : area.en}
              </button>
            ))}
          </div>
        </div>

        {filteredAreas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {language === "bn" ? "এই এলাকায় কোনো রেস্টুরেন্ট নেই" : "No restaurants in this area"}
            </p>
          </div>
        ) : (
          filteredAreas.map((area) => (
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
                      <button
                        onClick={() => toggleFavorite(restaurant.id)}
                        className="text-2xl transition-transform hover:scale-110"
                        title={favorites.has(restaurant.id) ? t("favorites", "removeFromFavorites") : t("favorites", "addToFavorites")}
                      >
                        {favorites.has(restaurant.id) ? "❤️" : "🤍"}
                      </button>
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
                      {t("restaurants", "viewOffer")}
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
      <BottomNav />
    </div>
  );
}
