"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

interface Redemption {
  id: string;
  code: string;
  customerPhone: string;
  offerText: string;
  redeemedAt: string;
  createdAt: string;
}

interface Stats {
  total: number;
  today: number;
}

interface Restaurant {
  id: string;
  name: string;
  area: string;
  type: string;
}

export default function RedemptionHistoryPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0 });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filtering, setFiltering] = useState(false);

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
        await fetchRedemptions();
      } catch {
        router.push("/restaurant/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchRedemptions = async (from?: string, to?: string) => {
    setFiltering(true);
    try {
      let url = "/api/restaurant/redemptions";
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setRedemptions(data.redemptions);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch redemptions:", error);
    } finally {
      setFiltering(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRedemptions(fromDate, toDate);
  };

  const handleClearFilter = () => {
    setFromDate("");
    setToDate("");
    fetchRedemptions();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 10) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
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
        <h1 className="text-xl font-bold text-gray-800">
          {language === "bn" ? "রিডেম্পশন হিস্ট্রি" : "Redemption History"}
        </h1>
        <p className="text-gray-600 text-sm">
          {language === "bn" ? "সব রিডিম করা কুপন দেখুন" : "View all redeemed coupons"}
        </p>
      </div>

      <main className="px-4 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{language === "bn" ? "আজকে" : "Today"}</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.today}</p>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500">{language === "bn" ? "মোট" : "Total"}</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
        </div>

        {/* Filter Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
          <form onSubmit={handleFilter} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fromDate" className="block text-xs font-medium text-gray-600 mb-1">
                  {language === "bn" ? "থেকে" : "From"}
                </label>
                <input
                  type="date"
                  id="fromDate"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
              </div>
              <div>
                <label htmlFor="toDate" className="block text-xs font-medium text-gray-600 mb-1">
                  {language === "bn" ? "পর্যন্ত" : "To"}
                </label>
                <input
                  type="date"
                  id="toDate"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={filtering}
                className="flex-1 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:bg-gray-300 transition-colors"
              >
                {filtering 
                  ? (language === "bn" ? "ফিল্টার হচ্ছে..." : "Filtering...") 
                  : (language === "bn" ? "ফিল্টার" : "Filter")}
              </button>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  {language === "bn" ? "ক্লিয়ার" : "Clear"}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Redemptions List */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden">
          {redemptions.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-sm">
                {language === "bn" ? "কোনো রিডেম্পশন পাওয়া যায়নি" : "No redemptions found"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {language === "bn" ? "রিডিম করা কুপন এখানে দেখাবে" : "Redeemed coupons will appear here"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {redemptions.map((redemption) => (
                <div key={redemption.id} className="p-4 hover:bg-gray-50/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          {redemption.code}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {redemption.offerText}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {formatPhone(redemption.customerPhone)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDate(redemption.redeemedAt)}
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 ml-3">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="max-w-lg mx-auto flex justify-around">
          <Link href="/restaurant/dashboard" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
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
            <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1 text-emerald-600 font-medium">
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
