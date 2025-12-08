"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CustomerNav from "@/components/CustomerNav";
import { useLanguage } from "@/lib/LanguageContext";

interface Badge {
  id: string;
  name: string;
  namebn: string;
  icon: string;
}

interface UserStats {
  couponsGenerated: number;
  couponsUsed: number;
  restaurantsTried: number;
  referralsCount: number;
  referralCode: string | null;
  badges: Badge[];
}

interface Favorite {
  id: string;
  restaurantId: string;
  restaurant: {
    id: string;
    name: string;
    area: string;
    offer: {
      offerText: string;
    } | null;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push("/login");
          return;
        }

        const [statsRes, favoritesRes] = await Promise.all([
          fetch("/api/user/stats"),
          fetch("/api/favorites"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (favoritesRes.ok) {
          const favoritesData = await favoritesRes.json();
          setFavorites(favoritesData.favorites || []);
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferralCode = () => {
    if (stats?.referralCode && navigator.share) {
      navigator.share({
        title: "Dealandme",
        text: language === "bn" 
          ? `Dealandme এ জয়েন করুন এবং রেস্টুরেন্ট ডিসকাউন্ট পান! আমার রেফারেল কোড: ${stats.referralCode}`
          : `Join Dealandme and get restaurant discounts! My referral code: ${stats.referralCode}`,
        url: "https://www.dealandme.com",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNav />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {t("profile", "title")}
        </h1>

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t("profile", "stats")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-3xl font-bold text-indigo-600">
                {stats?.couponsUsed || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {t("badges", "couponsUsed")}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {stats?.restaurantsTried || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {t("badges", "restaurantsTried")}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {stats?.couponsGenerated || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {language === "bn" ? "কুপন তৈরি" : "Coupons Generated"}
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {stats?.referralsCount || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {t("referral", "totalReferrals")}
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t("badges", "title")}
          </h2>
          {stats?.badges && stats.badges.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {stats.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <div className="text-sm font-medium text-gray-800">
                    {language === "bn" ? badge.namebn : badge.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🏅</div>
              <p className="text-gray-500">{t("badges", "noBadges")}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t("badges", "earnBadges")}
              </p>
            </div>
          )}
        </div>

        {/* Referral Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t("referral", "title")}
          </h2>
          <p className="text-gray-600 mb-4">{t("referral", "shareCode")}</p>
          
          {stats?.referralCode ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-mono text-lg text-center font-bold text-indigo-600">
                {stats.referralCode}
              </div>
              <button
                onClick={copyReferralCode}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                {copied ? t("referral", "copied") : t("referral", "copyCode")}
              </button>
              {typeof window !== "undefined" && typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={shareReferralCode}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  {language === "bn" ? "শেয়ার করুন" : "Share"}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">
                {language === "bn" ? "রেফারেল কোড লোড হচ্ছে..." : "Loading referral code..."}
              </p>
            </div>
          )}
        </div>

        {/* Favorites Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {t("favorites", "title")}
          </h2>
          {favorites.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/restaurants/${fav.restaurant.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {fav.restaurant.name}
                      </h3>
                      <p className="text-sm text-gray-500">{fav.restaurant.area}</p>
                    </div>
                    <span className="text-xl">❤️</span>
                  </div>
                  {fav.restaurant.offer && (
                    <div className="mt-2 text-sm text-indigo-600">
                      🎁 {fav.restaurant.offer.offerText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🤍</div>
              <p className="text-gray-500">{t("favorites", "noFavorites")}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t("favorites", "noFavoritesSubtitle")}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
