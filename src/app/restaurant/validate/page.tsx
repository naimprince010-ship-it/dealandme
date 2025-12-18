"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

type ValidationResult =
  | "REDEEMED"
  | "NOT_FOUND"
  | "WRONG_RESTAURANT"
  | "EXPIRED"
  | "ALREADY_USED"
  | null;

interface CouponInfo {
  code: string;
  offerText?: string;
  redeemedAt?: string;
}

interface Restaurant {
  id: string;
  name: string;
  area: string;
  type: string;
}

export default function ValidateCouponPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ValidationResult>(null);
  const [message, setMessage] = useState("");
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);

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
      } catch {
        router.push("/restaurant/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setValidating(true);
    setResult(null);
    setMessage("");
    setCouponInfo(null);

    try {
      const res = await fetch("/api/restaurant/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data.result);
        setMessage(data.message);
        if (data.coupon) {
          setCouponInfo(data.coupon);
        }
      } else {
        setMessage(data.error || "Failed to validate coupon");
      }
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setResult(null);
    setMessage("");
    setCouponInfo(null);
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

  const getResultStyles = () => {
    switch (result) {
      case "REDEEMED":
        return {
          bg: "bg-green-50",
          border: "border-green-200",
          icon: "text-green-500",
          title: "text-green-800",
          text: "text-green-700",
        };
      case "ALREADY_USED":
      case "EXPIRED":
      case "WRONG_RESTAURANT":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          icon: "text-yellow-500",
          title: "text-yellow-800",
          text: "text-yellow-700",
        };
      case "NOT_FOUND":
        return {
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "text-red-500",
          title: "text-red-800",
          text: "text-red-700",
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-200",
          icon: "text-gray-500",
          title: "text-gray-800",
          text: "text-gray-700",
        };
    }
  };

  const getResultIcon = () => {
    switch (result) {
      case "REDEEMED":
        return (
          <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "ALREADY_USED":
      case "EXPIRED":
      case "WRONG_RESTAURANT":
        return (
          <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case "NOT_FOUND":
        return (
          <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getResultTitle = () => {
    switch (result) {
      case "REDEEMED":
        return t("validation", "redeemed");
      case "ALREADY_USED":
        return t("validation", "alreadyUsed");
      case "EXPIRED":
        return t("validation", "expired");
      case "WRONG_RESTAURANT":
        return t("validation", "wrongRestaurant");
      case "NOT_FOUND":
        return t("validation", "notFound");
      default:
        return "";
    }
  };

  const styles = getResultStyles();

  return (
    <div className="min-h-screen pb-24" style={{ background: "linear-gradient(180deg, #7DD3C0 0%, #A8E6CF 30%, #F5F5F5 60%)" }}>
      {/* Header */}
      <div className="pt-6 pb-4 px-4">
        <h1 className="text-xl font-bold text-gray-800">
          {t("validation", "title")}
        </h1>
        <p className="text-gray-600 text-sm">
          {language === "bn" ? "কাস্টমার কুপন ভেরিফাই করুন" : "Verify customer coupons"}
        </p>
      </div>

      <main className="px-4">
        {!result ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-6">
            <form onSubmit={handleValidate}>
              <div className="mb-5">
                <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("validation", "enterCode")}
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={t("validation", "codePlaceholder")}
                  className="w-full px-4 py-4 text-xl font-mono tracking-widest border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 uppercase text-center bg-gray-50"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={validating || !code.trim()}
                className="w-full bg-emerald-500 text-white py-4 px-6 rounded-xl font-semibold text-base hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {validating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t("validation", "validating")}
                  </span>
                ) : (
                  t("validation", "validateButton")
                )}
              </button>
            </form>

            <div className="mt-5 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-sm text-emerald-700">
                {t("validation", "instructions")}
              </p>
            </div>
          </div>
        ) : (
          <div className={`${styles.bg} ${styles.border} border rounded-2xl p-6 text-center`}>
            <div className={`${styles.icon} flex justify-center mb-4`}>
              {getResultIcon()}
            </div>

            <h2 className={`text-lg font-bold ${styles.title} mb-2`}>
              {getResultTitle()}
            </h2>

            <p className={`${styles.text} text-sm mb-4`}>{message}</p>

            {couponInfo && result === "REDEEMED" && (
              <div className="bg-white rounded-xl p-4 mt-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm">
                  {language === "bn" ? "রিডেম্পশন বিবরণ" : "Redemption Details"}
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">{language === "bn" ? "কোড" : "Code"}:</dt>
                    <dd className="font-mono text-gray-900">{couponInfo.code}</dd>
                  </div>
                  {couponInfo.offerText && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">{language === "bn" ? "অফার" : "Offer"}:</dt>
                      <dd className="text-gray-900">{couponInfo.offerText}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <button
              onClick={handleReset}
              className="mt-5 w-full bg-white text-emerald-600 border-2 border-emerald-500 py-3 px-6 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
            >
              {language === "bn" ? "আরেকটি কুপন ভেরিফাই করুন" : "Validate Another Coupon"}
            </button>
          </div>
        )}
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
            <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1 text-emerald-600 font-medium">
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
