"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { getOffPeakStatus } from "@/lib/offer";
import InstallAppBanner from "@/components/InstallAppBanner";

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #7DD3C0 0%, #A8E6CF 50%, #E8F5E9 100%)" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white font-medium">
            {language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: "linear-gradient(180deg, #7DD3C0 0%, #A8E6CF 30%, #F5F5F5 60%)" }}>
      {/* Header */}
      <div className="pt-6 pb-4 px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {language === "bn" ? "ড্যাশবোর্ড" : "Dashboard"}
            </h1>
            {restaurant && (
              <p className="text-gray-600 text-sm">
                {language === "bn" ? "স্বাগতম" : "Welcome"}, {restaurant.name}
              </p>
            )}
          </div>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/restaurant/login");
            }}
            className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl text-gray-700 text-sm font-medium shadow-sm"
          >
            {language === "bn" ? "লগআউট" : "Logout"}
          </button>
        </div>
      </div>

      <main className="px-4 space-y-4">
        {/* Install App Banner */}
        <InstallAppBanner />

        {/* Daily Summary Stats */}
        {dailyStats && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>📊</span>
              {t("dashboard", "todaySummary")}
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{dailyStats.generated}</p>
                <p className="text-xs text-gray-500">{language === "bn" ? "জেনারেট" : "Generated"}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{dailyStats.redeemed}</p>
                <p className="text-xs text-gray-500">{language === "bn" ? "রিডিম" : "Redeemed"}</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{dailyStats.pending}</p>
                <p className="text-xs text-gray-500">{language === "bn" ? "পেন্ডিং" : "Pending"}</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-500">{dailyStats.expired}</p>
                <p className="text-xs text-gray-500">{language === "bn" ? "এক্সপায়ার" : "Expired"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Your Offer Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              {language === "bn" ? "আপনার অফার" : "Your Offer"}
            </h2>
            {offer && (
              <button
                onClick={toggleOfferActive}
                disabled={saving}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  offer.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {offer.isActive 
                  ? (language === "bn" ? "সক্রিয়" : "Active") 
                  : (language === "bn" ? "বিরতি" : "Paused")}
              </button>
            )}
          </div>
          
          {offer ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm">
                <span className="mr-2">🎁</span>
                {offer.offerText}
              </div>
              <Link
                href="/restaurant/offer/edit"
                className="px-4 py-3 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                {language === "bn" ? "এডিট" : "Edit"}
              </Link>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-3 text-sm">
                {language === "bn" ? "কোনো অফার নেই" : "No offer set"}
              </p>
              <Link
                href="/restaurant/offer/edit"
                className="inline-block px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                {language === "bn" ? "অফার তৈরি করুন" : "Create Offer"}
              </Link>
            </div>
          )}
        </div>

        {/* Off-Peak Boost Toggle */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-100">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                <span>🚀</span>
                {language === "bn" ? "অফ-পিক বুস্ট" : "Off-Peak Boost"}
              </h3>
              <p className="text-orange-700 text-xs mt-1">
                {language === "bn" 
                  ? "৩-৬টায় আপনার রেস্টুরেন্ট সবার আগে দেখাবে" 
                  : "Get priority visibility during 3-6pm"}
              </p>
              {offPeakBoost && (
                <p className={`text-xs mt-1.5 ${offPeakStatus.isActive ? "text-green-600" : "text-yellow-600"}`}>
                  {offPeakStatus.isActive ? "🟢" : "🟡"}{" "}
                  {language === "bn" ? offPeakStatus.labelBn : offPeakStatus.label}
                </p>
              )}
            </div>
            <button
              onClick={toggleOffPeakBoost}
              disabled={saving}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                offPeakBoost ? "bg-orange-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  offPeakBoost ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        {analytics && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>📈</span>
              {language === "bn" ? "সাপ্তাহিক পরিসংখ্যান" : "Weekly Analytics"}
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xl font-bold text-blue-600">{analytics.summary.thisWeekRedeemed}</p>
                <p className="text-xs text-gray-500">{language === "bn" ? "এই সপ্তাহ" : "This Week"}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <p className="text-xl font-bold text-green-600">{analytics.summary.lastWeekRedeemed}</p>
                <p className="text-xs text-gray-500">{language === "bn" ? "গত সপ্তাহ" : "Last Week"}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <p className="text-xl font-bold text-purple-600">{analytics.summary.conversionRate}%</p>
                <p className="text-xs text-gray-500">{language === "bn" ? "কনভার্শন" : "Conversion"}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xl font-bold text-orange-600">{analytics.customers.repeatRate}%</p>
                <p className="text-xs text-gray-500">{language === "bn" ? "রিপিট রেট" : "Repeat Rate"}</p>
              </div>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <h3 className="text-xs font-medium text-gray-500 mb-2">
                {language === "bn" ? "কাস্টমার বিশ্লেষণ" : "Customer Breakdown"}
              </h3>
              <div className="flex gap-4">
                <div>
                  <span className="text-lg font-bold text-indigo-600">{analytics.customers.uniqueCustomers}</span>
                  <span className="text-xs text-gray-500 ml-1">{language === "bn" ? "মোট" : "Total"}</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-green-600">{analytics.customers.repeatCustomers}</span>
                  <span className="text-xs text-gray-500 ml-1">{language === "bn" ? "রিপিট" : "Repeat"}</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-blue-600">{analytics.customers.newCustomers}</span>
                  <span className="text-xs text-gray-500 ml-1">{language === "bn" ? "নতুন" : "New"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/restaurant/validate"
            className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800">
              {t("dashboard", "validateCoupon")}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {language === "bn" ? "কুপন ভেরিফাই করুন" : "Verify coupons"}
            </p>
          </Link>

          <Link
            href="/restaurant/history"
            className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-800">
              {t("dashboard", "history")}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {language === "bn" ? "রিডেম্পশন দেখুন" : "View redemptions"}
            </p>
          </Link>
        </div>

        {/* Billing Link */}
        <Link
          href="/restaurant/billing"
          className="block bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-800">
                {language === "bn" ? "বিলিং" : "Billing"}
              </h3>
              <p className="text-xs text-gray-500">
                {language === "bn" ? "ইনভয়েস ও পেমেন্ট" : "Invoices & payments"}
              </p>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* Quick Tip */}
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
          <h3 className="text-sm font-semibold text-emerald-900 mb-1">
            {t("dashboard", "quickTip")}
          </h3>
          <p className="text-xs text-emerald-700">
            {t("dashboard", "tipText")}
          </p>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="max-w-lg mx-auto flex justify-around">
          <Link href="/restaurant/dashboard" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-xs mt-1 text-emerald-600 font-medium">
              {language === "bn" ? "হোম" : "Home"}
            </span>
          </Link>
          <Link href="/restaurant/validate" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
              {language === "bn" ? "ভেরিফাই" : "Validate"}
            </span>
          </Link>
          <Link href="/restaurant/history" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
              {language === "bn" ? "হিস্ট্রি" : "History"}
            </span>
          </Link>
          <Link href="/restaurant/billing" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
              {language === "bn" ? "বিলিং" : "Billing"}
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
