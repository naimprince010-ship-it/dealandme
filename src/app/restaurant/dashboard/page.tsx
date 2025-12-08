"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RestaurantNav from "@/components/RestaurantNav";
import { useLanguage } from "@/lib/LanguageContext";
import { getOffPeakStatus } from "@/lib/offer";

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

interface Offer {
  id: string;
  offerText: string;
  isActive: boolean;
}

interface Analytics {
  summary: {
    todayRedeemed: number;
    thisWeekRedeemed: number;
    lastWeekRedeemed: number;
    thisMonthRedeemed: number;
    totalRedeemed: number;
    conversionRate: number;
  };
  customers: {
    uniqueCustomers: number;
    repeatCustomers: number;
    newCustomers: number;
    repeatRate: number;
  };
}

export default function RestaurantDashboard() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [offPeakBoost, setOffPeakBoost] = useState(false);
  const [offPeakStatus, setOffPeakStatus] = useState(getOffPeakStatus(false));
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        
        // Fetch daily stats, offer, and analytics in parallel
        const [statsRes, offerRes, analyticsRes] = await Promise.all([
          fetch("/api/restaurant/daily-stats"),
          fetch("/api/restaurant/offer"),
          fetch("/api/restaurant/analytics"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setDailyStats(statsData.stats);
        }

        if (offerRes.ok) {
          const offerData = await offerRes.json();
          setOffer(offerData.offer);
          setOffPeakBoost(offerData.offPeakBoost || false);
          setOffPeakStatus(getOffPeakStatus(offerData.offPeakBoost || false));
        }

        if (analyticsRes.ok) {
          const analyticsData = await analyticsRes.json();
          setAnalytics(analyticsData);
        }
      } catch {
        router.push("/restaurant/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const toggleOfferActive = async () => {
    if (!offer) return;
    setSaving(true);
    try {
      const res = await fetch("/api/restaurant/offer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      if (res.ok) {
        const data = await res.json();
        setOffer(data.offer);
      }
    } catch (error) {
      console.error("Toggle offer error:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleOffPeakBoost = async () => {
    setSaving(true);
    const newValue = !offPeakBoost;
    try {
      const res = await fetch("/api/restaurant/offer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offPeakBoost: newValue }),
      });
      if (res.ok) {
        setOffPeakBoost(newValue);
        setOffPeakStatus(getOffPeakStatus(newValue));
      }
    } catch (error) {
      console.error("Toggle off-peak boost error:", error);
    } finally {
      setSaving(false);
    }
  };

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

        {/* Offer Management Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {language === "bn" ? "আপনার অফার" : "Your Offer"}
            </h2>
            {offer && (
              <button
                onClick={toggleOfferActive}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  offer.isActive
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                {offer.isActive 
                  ? (language === "bn" ? "সক্রিয়" : "Active") 
                  : (language === "bn" ? "বিরতি" : "Paused")}
              </button>
            )}
          </div>
          
          {offer ? (
            <div className="flex items-center justify-between">
              <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-lg flex-1 mr-4">
                <span className="mr-2">🎁</span>
                {offer.offerText}
              </div>
              <Link
                href="/restaurant/offer/edit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {language === "bn" ? "এডিট করুন" : "Edit Offer"}
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">
                {language === "bn" ? "কোনো অফার নেই" : "No offer set"}
              </p>
              <Link
                href="/restaurant/offer/edit"
                className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {language === "bn" ? "অফার তৈরি করুন" : "Create Offer"}
              </Link>
            </div>
          )}
        </div>

        {/* Off-Peak Boost Toggle */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 mb-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-orange-900 flex items-center gap-2">
                <span>🚀</span>
                {language === "bn" ? "অফ-পিক বুস্ট" : "Off-Peak Boost"}
              </h3>
              <p className="text-orange-700 text-sm mt-1">
                {language === "bn" 
                  ? "৩-৬টায় আপনার রেস্টুরেন্ট সবার আগে দেখাবে" 
                  : "Get priority visibility during 3-6pm"}
              </p>
              {offPeakBoost && (
                <p className={`text-sm mt-2 ${offPeakStatus.isActive ? "text-green-600" : "text-yellow-600"}`}>
                  {offPeakStatus.isActive ? "🟢" : "🟡"}{" "}
                  {language === "bn" ? offPeakStatus.labelBn : offPeakStatus.label}
                </p>
              )}
            </div>
            <button
              onClick={toggleOffPeakBoost}
              disabled={saving}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                offPeakBoost ? "bg-orange-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  offPeakBoost ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        {analytics && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📈</span>
              {language === "bn" ? "সাপ্তাহিক পরিসংখ্যান" : "Weekly Analytics"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{analytics.summary.thisWeekRedeemed}</p>
                <p className="text-sm text-gray-600">{language === "bn" ? "এই সপ্তাহ" : "This Week"}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{analytics.summary.lastWeekRedeemed}</p>
                <p className="text-sm text-gray-600">{language === "bn" ? "গত সপ্তাহ" : "Last Week"}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{analytics.summary.conversionRate}%</p>
                <p className="text-sm text-gray-600">{language === "bn" ? "কনভার্শন" : "Conversion"}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{analytics.customers.repeatRate}%</p>
                <p className="text-sm text-gray-600">{language === "bn" ? "রিপিট কাস্টমার" : "Repeat Rate"}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {language === "bn" ? "কাস্টমার বিশ্লেষণ" : "Customer Breakdown"}
              </h3>
              <div className="flex gap-6">
                <div>
                  <span className="text-2xl font-bold text-indigo-600">{analytics.customers.uniqueCustomers}</span>
                  <span className="text-sm text-gray-500 ml-2">{language === "bn" ? "মোট কাস্টমার" : "Total Customers"}</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-green-600">{analytics.customers.repeatCustomers}</span>
                  <span className="text-sm text-gray-500 ml-2">{language === "bn" ? "রিপিট" : "Repeat"}</span>
                </div>
                <div>
                  <span className="text-2xl font-bold text-blue-600">{analytics.customers.newCustomers}</span>
                  <span className="text-sm text-gray-500 ml-2">{language === "bn" ? "নতুন" : "New"}</span>
                </div>
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
