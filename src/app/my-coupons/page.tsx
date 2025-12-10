"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";
import { MyCouponsSkeleton, Skeleton } from "@/components/Skeleton";

interface Coupon {
  id: string;
  code: string;
  status: string;
  effectiveStatus: string;
  createdAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  restaurant: {
    id: string;
    name: string;
    area: string;
  };
  offer: {
    offerText: string;
    photoUrl: string | null;
    discountType: string | null;
    discountValue: number | null;
  };
}

export default function MyCouponsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "used" | "expired">("active");

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push("/login?redirect=/my-coupons");
          return;
        }

        const res = await fetch("/api/coupons/my");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch coupons");
        }

        setCoupons(data.coupons || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchCoupons();
  }, [router]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString(language === "bn" ? "bn-BD" : "en-IN", { month: "short" });
    const year = date.getFullYear();
    const time = date.toLocaleString(language === "bn" ? "bn-BD" : "en-IN", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
    return `${day} ${month} ${year}, ${time}`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) {
      return language === "bn" ? `${minutes} মিনিট বাকি` : `${minutes} min left`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return language === "bn" ? `${hours} ঘন্টা বাকি` : `${hours}h left`;
    }
    const days = Math.floor(hours / 24);
    return language === "bn" ? `${days} দিন বাকি` : `${days}d left`;
  };

  const getDiscountBadge = (discountType: string | null, discountValue: number | null) => {
    if (!discountValue) return null;
    if (discountType === "PERCENTAGE") {
      return language === "bn" ? `${discountValue}% ছাড়` : `${discountValue}% OFF`;
    }
    return language === "bn" ? `৳${discountValue} ছাড়` : `৳${discountValue} OFF`;
  };

  const filteredCoupons = coupons.filter((coupon) => {
    if (activeTab === "active") return coupon.effectiveStatus === "UNUSED";
    if (activeTab === "used") return coupon.effectiveStatus === "USED";
    if (activeTab === "expired") return coupon.effectiveStatus === "EXPIRED";
    return true;
  });

  const activeCouponsCount = coupons.filter((c) => c.effectiveStatus === "UNUSED").length;
  const usedCouponsCount = coupons.filter((c) => c.effectiveStatus === "USED").length;
  const expiredCouponsCount = coupons.filter((c) => c.effectiveStatus === "EXPIRED").length;

  if (loading) {
    return (
      <div className="min-h-screen pb-24 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
      }}>
        <LoginBackgroundPattern />
        <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex gap-2 mb-6 bg-white/60 rounded-xl p-1.5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="flex-1 h-10 rounded-lg" />
            ))}
          </div>
          <MyCouponsSkeleton />
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
            {language === "bn" ? "আমার কুপন" : "My Coupons"}
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-white/60 rounded-xl p-1.5">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "active"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-white/50"
            }`}
            style={{ fontFamily: "var(--font-bangla), sans-serif" }}
          >
            {language === "bn" ? "সক্রিয়" : "Active"} ({activeCouponsCount})
          </button>
          <button
            onClick={() => setActiveTab("used")}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "used"
                ? "bg-gray-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-white/50"
            }`}
            style={{ fontFamily: "var(--font-bangla), sans-serif" }}
          >
            {language === "bn" ? "ব্যবহৃত" : "Used"} ({usedCouponsCount})
          </button>
          <button
            onClick={() => setActiveTab("expired")}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "expired"
                ? "bg-rose-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-white/50"
            }`}
            style={{ fontFamily: "var(--font-bangla), sans-serif" }}
          >
            {language === "bn" ? "মেয়াদোত্তীর্ণ" : "Expired"} ({expiredCouponsCount})
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-sm" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {error}
          </div>
        )}

        {/* Content */}
        {filteredCoupons.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="relative mb-8">
              <div className="w-40 h-40 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-gray-100">
                    <span className="text-5xl">🎟️</span>
                  </div>
                  {activeTab === "active" && (
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute top-0 left-0 w-4 h-4 bg-emerald-300 rounded-full opacity-60"></div>
              <div className="absolute bottom-4 right-0 w-3 h-3 bg-amber-300 rounded-full opacity-60"></div>
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-2 text-center" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {activeTab === "active" && (language === "bn" ? "কোনো সক্রিয় কুপন নেই" : "No active coupons")}
              {activeTab === "used" && (language === "bn" ? "কোনো ব্যবহৃত কুপন নেই" : "No used coupons")}
              {activeTab === "expired" && (language === "bn" ? "কোনো মেয়াদোত্তীর্ণ কুপন নেই" : "No expired coupons")}
            </h2>
            <p className="text-gray-500 text-center mb-8" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {activeTab === "active" && (language === "bn" ? "রেস্টুরেন্ট থেকে কুপন সংগ্রহ করুন!" : "Get coupons from restaurants!")}
              {activeTab === "used" && (language === "bn" ? "আপনি এখনো কোনো কুপন ব্যবহার করেননি" : "You haven't used any coupons yet")}
              {activeTab === "expired" && (language === "bn" ? "কোনো মেয়াদোত্তীর্ণ কুপন নেই" : "No expired coupons")}
            </p>

            {activeTab === "active" && (
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
            )}
          </div>
        ) : (
          /* Coupon Cards */
          <div className="space-y-4">
            {filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white/95 rounded-2xl shadow-sm border overflow-hidden transition-all ${
                  coupon.effectiveStatus === "UNUSED"
                    ? "border-emerald-200"
                    : coupon.effectiveStatus === "EXPIRED"
                    ? "border-rose-200 opacity-75"
                    : "border-gray-200 opacity-75"
                }`}
              >
                <div className="flex">
                  {/* Restaurant Image */}
                  <div className="w-28 h-32 flex-shrink-0 relative">
                    {coupon.offer.photoUrl ? (
                      <img
                        src={coupon.offer.photoUrl}
                        alt={coupon.restaurant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                    {/* Discount Badge */}
                    {coupon.offer.discountValue && (
                      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white ${
                        coupon.effectiveStatus === "UNUSED" ? "bg-emerald-500" : "bg-gray-400"
                      }`}>
                        {getDiscountBadge(coupon.offer.discountType, coupon.offer.discountValue)}
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                      coupon.effectiveStatus === "UNUSED"
                        ? "bg-emerald-100 text-emerald-700"
                        : coupon.effectiveStatus === "EXPIRED"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {coupon.effectiveStatus === "UNUSED" && (language === "bn" ? "সক্রিয়" : "Active")}
                      {coupon.effectiveStatus === "USED" && (language === "bn" ? "ব্যবহৃত" : "Used")}
                      {coupon.effectiveStatus === "EXPIRED" && (language === "bn" ? "মেয়াদোত্তীর্ণ" : "Expired")}
                    </div>
                  </div>

                  {/* Coupon Info */}
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-base leading-tight" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                        {coupon.restaurant.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {coupon.restaurant.area}
                      </p>
                      
                      {/* Offer Text */}
                      <div className={`mt-2 px-2 py-1.5 rounded-lg text-xs ${
                        coupon.effectiveStatus === "UNUSED"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-50 text-gray-600"
                      }`} style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                        🎁 {coupon.offer.offerText}
                      </div>
                    </div>

                    {/* Code and Time */}
                    <div className="mt-2 flex items-center justify-between">
                      <div className={`font-mono text-lg font-bold ${
                        coupon.effectiveStatus === "UNUSED"
                          ? "text-emerald-600"
                          : "text-gray-400"
                      }`}>
                        {coupon.code}
                      </div>
                      <div className="text-right">
                        {coupon.effectiveStatus === "UNUSED" && getTimeRemaining(coupon.expiresAt) && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                            {getTimeRemaining(coupon.expiresAt)}
                          </span>
                        )}
                        {coupon.effectiveStatus === "USED" && coupon.redeemedAt && (
                          <span className="text-xs text-gray-500">
                            {formatDate(coupon.redeemedAt)}
                          </span>
                        )}
                        {coupon.effectiveStatus === "EXPIRED" && (
                          <span className="text-xs text-rose-500">
                            {formatDate(coupon.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* View Restaurant Button for Active Coupons */}
                    {coupon.effectiveStatus === "UNUSED" && (
                      <Link
                        href={`/restaurants/${coupon.restaurant.id}`}
                        className="mt-2 inline-flex items-center justify-center px-4 py-1.5 border-2 border-emerald-500 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
                        style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                      >
                        {language === "bn" ? "রেস্টুরেন্ট দেখুন" : "View Restaurant"}
                      </Link>
                    )}
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
