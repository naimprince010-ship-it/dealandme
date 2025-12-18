"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";
import InstallAppBanner from "@/components/InstallAppBanner";
import { HomePageSkeleton } from "@/components/Skeleton";
import AuthDebugOverlay from "@/components/AuthDebugOverlay";

interface HomeCategory {
  id: string;
  key: string;
  labelEn: string;
  labelBn: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
}

interface FeaturedOffer {
  id: string;
  offerText: string;
  discountType: string | null;
  discountValue: number | null;
  photoUrl: string | null;
  restaurant: {
    id: string;
    name: string;
    area: string;
    cuisine: string | null;
  };
}

interface PopularRestaurant {
  id: string;
  name: string;
  area: string;
  cuisine: string | null;
  offer: {
    id: string;
    offerText: string;
    discountType: string | null;
    discountValue: number | null;
    photoUrl: string | null;
    isActive: boolean;
  } | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  near_me: "📍",
  buffet: "🍽️",
  cafe: "☕",
  diler: "🍛",
  cooking: "👨‍🍳",
  stoas: "🏪",
  fast_food: "🍔",
  chinese: "🥡",
  indian: "🍛",
  thai: "🍜",
  dessert: "🍰",
  pizza: "🍕",
};

interface HomeCache {
  userName: string;
  userPhotoUrl: string;
  categories: HomeCategory[];
  featuredOffers: FeaturedOffer[];
  popularRestaurants: PopularRestaurant[];
  nearbyRestaurants: PopularRestaurant[];
  locationEnabled: boolean;
  timestamp: number;
}

let homeCache: HomeCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export default function HomePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  // Always start with loading = true to ensure auth check completes before showing content
  // This prevents a race condition where cached content is shown before auth is verified
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userPhotoUrl, setUserPhotoUrl] = useState("");
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [featuredOffers, setFeaturedOffers] = useState<FeaturedOffer[]>([]);
  const [popularRestaurants, setPopularRestaurants] = useState<PopularRestaurant[]>([]);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<PopularRestaurant[]>([]);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchHomeData = useCallback(async (lat?: number, lng?: number, currentUserName?: string, currentUserPhotoUrl?: string, currentLocationEnabled?: boolean) => {
    try {
      let url = "/api/home";
      if (lat && lng) {
        url += `?lat=${lat}&lng=${lng}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const newCategories = data.categories || [];
        const newFeaturedOffers = data.featuredOffers || [];
        const newPopularRestaurants = data.popularRestaurants || [];
        const newNearbyRestaurants = data.nearbyRestaurants || [];
        
        setCategories(newCategories);
        setFeaturedOffers(newFeaturedOffers);
        setPopularRestaurants(newPopularRestaurants);
        setNearbyRestaurants(newNearbyRestaurants);
        
        homeCache = {
          userName: currentUserName ?? userName,
          userPhotoUrl: currentUserPhotoUrl ?? userPhotoUrl,
          categories: newCategories,
          featuredOffers: newFeaturedOffers,
          popularRestaurants: newPopularRestaurants,
          nearbyRestaurants: newNearbyRestaurants,
          locationEnabled: currentLocationEnabled ?? locationEnabled,
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
    }
  }, [userName, userPhotoUrl, locationEnabled]);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push("/login");
          return;
        }

        const phone = authData.user?.phone || "";
        const rawName = authData.user?.name?.trim() || "";
        const newUserName = rawName || `...${phone.slice(-4)}`;
        const newUserPhotoUrl = authData.user?.photoUrl || "";
        
        setUserName(newUserName);
        setUserPhotoUrl(newUserPhotoUrl);

        const cacheIsValid = homeCache && (Date.now() - homeCache.timestamp) < CACHE_TTL_MS;
        
        if (cacheIsValid && homeCache) {
          // Auth passed, now safe to use cached data
          setCategories(homeCache.categories);
          setFeaturedOffers(homeCache.featuredOffers);
          setPopularRestaurants(homeCache.popularRestaurants);
          setNearbyRestaurants(homeCache.nearbyRestaurants);
          setLocationEnabled(homeCache.locationEnabled);
          setLoading(false);
          // Refresh data in background
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setLocationEnabled(true);
                fetchHomeData(position.coords.latitude, position.coords.longitude, newUserName, newUserPhotoUrl, true);
              },
              () => {
                fetchHomeData(undefined, undefined, newUserName, newUserPhotoUrl, false);
              }
            );
          } else {
            fetchHomeData(undefined, undefined, newUserName, newUserPhotoUrl, false);
          }
        } else {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setLocationEnabled(true);
                fetchHomeData(position.coords.latitude, position.coords.longitude, newUserName, newUserPhotoUrl, true);
                setLoading(false);
              },
              () => {
                fetchHomeData(undefined, undefined, newUserName, newUserPhotoUrl, false);
                setLoading(false);
              }
            );
          } else {
            fetchHomeData(undefined, undefined, newUserName, newUserPhotoUrl, false);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error initializing:", error);
        router.push("/login");
      }
    }

    init();
  }, [router, fetchHomeData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/restaurants?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleCategoryClick = (category: HomeCategory) => {
    if (category.key === "near_me") {
      if (!locationEnabled) {
        alert(t("home", "locationPermission"));
        return;
      }
      router.push("/restaurants?sort=nearby");
    } else {
      router.push(`/restaurants?category=${category.key}`);
    }
  };

  const getDiscountBadge = (discountType: string | null, discountValue: number | null) => {
    if (!discountValue) return null;
    if (discountType === "PERCENTAGE") {
      return language === "bn" ? `${discountValue}% ${t("home", "off")}` : `${discountValue}% ${t("home", "off")}`;
    }
    return `৳${discountValue} ${t("home", "off")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
      }}>
        <LoginBackgroundPattern />
        <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="skeleton w-12 h-12 rounded-full" />
            <div className="skeleton h-6 w-40" />
          </div>
          <HomePageSkeleton />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
    }}>
      <LoginBackgroundPattern />
      
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {userPhotoUrl ? (
                <img
                  src={userPhotoUrl}
                  alt={userName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-800 truncate max-w-[200px]" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {t("home", "greeting")}{userName ? `, ${userName}` : ""}!
            </h1>
          </div>
                    <button 
                      onClick={() => router.push("/notifications")}
                      className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm"
                    >
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </button>
        </div>

        {/* Install App Banner */}
        <InstallAppBanner />

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("home", "searchPlaceholder")}
              className="w-full px-4 py-3 pl-10 bg-white/90 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-gray-800 placeholder-gray-400"
              style={{ fontFamily: "var(--font-bangla), sans-serif" }}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="button"
            onClick={() => router.push("/restaurants")}
            className="w-12 h-12 bg-white/90 rounded-xl flex items-center justify-center shadow-sm border border-gray-200"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </form>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="mb-6 overflow-x-auto pb-2 -mx-4 px-4">
            <div className="flex gap-4" style={{ minWidth: "max-content" }}>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="flex flex-col items-center gap-2 min-w-[70px]"
                >
                  <div className="w-14 h-14 bg-white/90 rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
                    <span className="text-2xl">{CATEGORY_ICONS[category.iconKey] || "📁"}</span>
                  </div>
                  <span className="text-xs text-gray-700 font-medium text-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? category.labelBn : category.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured Deals */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {t("home", "featuredDeals")}
            </h2>
            <Link href="/restaurants" className="text-sm text-emerald-600 font-medium">
              {t("home", "seeAll")} &gt;
            </Link>
          </div>

          {/* Fixed min-height to prevent CLS when switching between empty/loaded states */}
          <div style={{ minHeight: "280px" }}>
          {featuredOffers.length === 0 ? (
            <div className="bg-white/80 rounded-2xl p-8 text-center flex items-center justify-center" style={{ minHeight: "280px" }}>
              <p className="text-gray-500" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {t("home", "noFeaturedDeals")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2 -mx-4 px-4">
              <div className="flex gap-4" style={{ minWidth: "max-content" }}>
                {featuredOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="w-72 bg-white/90 rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-shrink-0"
                  >
                    <div className="relative h-40">
                      {offer.photoUrl ? (
                        <img
                          src={offer.photoUrl}
                          alt={offer.restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-5xl">🍽️</span>
                        </div>
                      )}
                      {offer.discountValue && (
                        <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                          {getDiscountBadge(offer.discountType, offer.discountValue)}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 mb-1" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                        {offer.restaurant.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-3">
                        {offer.restaurant.area}{offer.restaurant.cuisine ? `, ${offer.restaurant.cuisine}` : ""}
                      </p>
                      <Link
                        href={`/restaurants/${offer.restaurant.id}`}
                        className="block w-full py-2.5 text-center rounded-xl font-semibold text-white transition-all"
                        style={{
                          background: "linear-gradient(135deg, #5BA88B 0%, #4A9A7C 100%)",
                          fontFamily: "var(--font-bangla), sans-serif"
                        }}
                      >
                        {t("home", "bookNow")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </section>

        {/* Nearby Restaurants (if location enabled) */}
        {locationEnabled && nearbyRestaurants.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {t("home", "nearbyRestaurants")}
              </h2>
              <Link href="/restaurants?sort=nearby" className="text-sm text-emerald-600 font-medium">
                {t("home", "seeAll")} &gt;
              </Link>
            </div>
            <div className="space-y-3">
              {nearbyRestaurants.slice(0, 5).map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurants/${restaurant.id}`}
                  className="flex items-center gap-4 bg-white/90 rounded-xl p-3 shadow-sm border border-gray-100"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {restaurant.offer?.photoUrl ? (
                      <img
                        src={restaurant.offer.photoUrl}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🍽️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{restaurant.area}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Popular Restaurants */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {t("home", "popularRestaurants")}
            </h2>
            <Link href="/restaurants" className="text-sm text-emerald-600 font-medium">
              {t("home", "seeAll")} &gt;
            </Link>
          </div>

          {/* Fixed min-height to prevent CLS when switching between empty/loaded states */}
          <div style={{ minHeight: "260px" }}>
          {popularRestaurants.length === 0 ? (
            <div className="bg-white/80 rounded-2xl p-8 text-center flex items-center justify-center" style={{ minHeight: "260px" }}>
              <p className="text-gray-500" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {t("home", "noPopularRestaurants")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {popularRestaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurants/${restaurant.id}`}
                  className="flex items-center gap-4 bg-white/90 rounded-xl p-3 shadow-sm border border-gray-100"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    {restaurant.offer?.photoUrl ? (
                      <img
                        src={restaurant.offer.photoUrl}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">🍽️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                      {restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{restaurant.area}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          </div>
        </section>
      </main>

      <BottomNav />
      <AuthDebugOverlay />
    </div>
  );
}
