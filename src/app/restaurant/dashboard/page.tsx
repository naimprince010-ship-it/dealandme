"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RestaurantNav from "@/components/RestaurantNav";
import { useLanguage } from "@/lib/LanguageContext";

interface Restaurant {
  id: string;
  name: string;
  area: string;
  type: string;
}

interface DailyStats {
  generated: number;
  redeemed: number;
  pending: number;
  expired: number;
}

export default function RestaurantDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.authenticated || data.user?.type !== "RESTAURANT") {
          router.push("/restaurant/login");
          return;
        }

        setRestaurant(data.user);
        
        // Fetch daily stats
        const statsRes = await fetch("/api/restaurant/daily-stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setDailyStats(statsData.stats);
        }
      } catch {
        router.push("/restaurant/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantNav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("dashboard", "title")}</h1>
          {restaurant && (
            <p className="text-gray-500">{t("dashboard", "welcome")}, {restaurant.name}</p>
          )}
        </div>

        {/* Daily Summary Stats */}
        {dailyStats && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="text-xl">📊</span>
              {t("dashboard", "todaySummary")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold">{dailyStats.generated}</p>
                <p className="text-sm opacity-90">{t("dashboard", "generated")}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-200">{dailyStats.redeemed}</p>
                <p className="text-sm opacity-90">{t("dashboard", "redeemed")}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-yellow-200">{dailyStats.pending}</p>
                <p className="text-sm opacity-90">{t("dashboard", "pending")}</p>
              </div>
              <div className="bg-white/20 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-red-200">{dailyStats.expired}</p>
                <p className="text-sm opacity-90">{t("dashboard", "expired")}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/restaurant/validate"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("dashboard", "validateCoupon")}
            </h3>
            <p className="text-gray-600">
              {t("dashboard", "validateDesc")}
            </p>
          </Link>

          <Link
            href="/restaurant/history"
            className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("dashboard", "history")}
            </h3>
            <p className="text-gray-600">
              {t("dashboard", "historyDesc")}
            </p>
          </Link>
        </div>

        <div className="mt-8 bg-indigo-50 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-indigo-900 mb-2">
            {t("dashboard", "quickTip")}
          </h3>
          <p className="text-indigo-700">
            {t("dashboard", "tipText")}
          </p>
        </div>
      </main>
    </div>
  );
}
