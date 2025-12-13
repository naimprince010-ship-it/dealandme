"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import BottomNav from "@/components/BottomNav";
import { useLanguage } from "@/lib/LanguageContext";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";
import { RestaurantListSkeleton, Skeleton } from "@/components/Skeleton";
import AreaFilterChips from "./components/AreaFilterChips";

const RecommendationsSection = dynamic(
  () => import("./components/RecommendationsSection"),
  { ssr: false, loading: () => null }
);

const RecentlyVisitedSection = dynamic(
  () => import("./components/RecentlyVisitedSection"),
  { ssr: false, loading: () => null }
);

const RestaurantList = dynamic(
  () => import("./components/RestaurantList"),
  { ssr: true, loading: () => <RestaurantListSkeleton /> }
);

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
        const res = await fetch("/api/restaurants-page");
        const data = await res.json();

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch restaurants");
        }

        setGroupedRestaurants(data.restaurants?.groupedByArea || {});

        const favIds = new Set<string>(
          data.favorites?.favorites?.map((f: { restaurantId: string }) => f.restaurantId) || []
        );
        setFavorites(favIds);

        setRecentlyVisited(data.visitHistory?.recentlyVisited || []);

        setRecommendations(data.recommendations?.recommendations || []);
        if (data.recommendations?.recommendations?.length > 0 && data.recommendations?.preferences?.totalVisits > 0) {
          setShowRecommendations(true);
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
        setFavorites(favorites);
      }
    } catch {
      setFavorites(favorites);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
      }}>
        <LoginBackgroundPattern />
        <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex gap-2 mb-6 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-xl flex-shrink-0" />
            ))}
          </div>
          <RestaurantListSkeleton />
        </main>
        <BottomNav />
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

  const restaurantAreas = Object.keys(groupedRestaurants);

  if (restaurantAreas.length === 0) {
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

        <AreaFilterChips
          restaurantAreas={restaurantAreas}
          selectedArea={selectedArea}
          onSelectArea={setSelectedArea}
        />

        <Suspense fallback={null}>
          <RecommendationsSection
            recommendations={recommendations}
            showRecommendations={showRecommendations}
          />
        </Suspense>

        <Suspense fallback={null}>
          <RecentlyVisitedSection recentlyVisited={recentlyVisited} />
        </Suspense>

        <Suspense fallback={<RestaurantListSkeleton />}>
          <RestaurantList
            groupedRestaurants={groupedRestaurants}
            favorites={favorites}
            selectedArea={selectedArea}
            onToggleFavorite={toggleFavorite}
          />
        </Suspense>
      </main>

      <BottomNav />
    </div>
  );
}
