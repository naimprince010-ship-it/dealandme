"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RestaurantNav from "@/components/RestaurantNav";

type ValidationResult =
  | "REDEEMED"
  | "NOT_FOUND"
  | "WRONG_RESTAURANT"
  | "EXPIRED"
  | "ALREADY_USED"
  | null;

interface CouponInfo {
  code: string;
  customerPhone?: string;
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
          <svg
            className="w-16 h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "ALREADY_USED":
      case "EXPIRED":
      case "WRONG_RESTAURANT":
        return (
          <svg
            className="w-16 h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "NOT_FOUND":
        return (
          <svg
            className="w-16 h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getResultTitle = () => {
    switch (result) {
      case "REDEEMED":
        return "Coupon Redeemed!";
      case "ALREADY_USED":
        return "Already Used";
      case "EXPIRED":
        return "Coupon Expired";
      case "WRONG_RESTAURANT":
        return "Wrong Restaurant";
      case "NOT_FOUND":
        return "Not Found";
      default:
        return "";
    }
  };

  const styles = getResultStyles();

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantNav />

      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Validate Coupon</h1>

        {!result ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <form onSubmit={handleValidate}>
              <div className="mb-4">
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Enter Coupon Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC12345"
                  className="w-full px-4 py-3 text-lg font-mono tracking-wider border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                  autoComplete="off"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={validating || !code.trim()}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {validating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Validating...
                  </span>
                ) : (
                  "Validate Coupon"
                )}
              </button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Ask the customer to show their coupon code, then enter it above
                to validate and redeem.
              </p>
            </div>
          </div>
        ) : (
          <div
            className={`${styles.bg} ${styles.border} border rounded-xl p-6 text-center`}
          >
            <div className={`${styles.icon} flex justify-center mb-4`}>
              {getResultIcon()}
            </div>

            <h2 className={`text-xl font-bold ${styles.title} mb-2`}>
              {getResultTitle()}
            </h2>

            <p className={`${styles.text} mb-4`}>{message}</p>

            {couponInfo && result === "REDEEMED" && (
              <div className="bg-white rounded-lg p-4 mt-4 text-left">
                <h3 className="font-medium text-gray-900 mb-2">
                  Redemption Details
                </h3>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Code:</dt>
                    <dd className="font-mono text-gray-900">{couponInfo.code}</dd>
                  </div>
                  {couponInfo.customerPhone && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Customer:</dt>
                      <dd className="text-gray-900">{couponInfo.customerPhone}</dd>
                    </div>
                  )}
                  {couponInfo.offerText && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Offer:</dt>
                      <dd className="text-gray-900">{couponInfo.offerText}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            <button
              onClick={handleReset}
              className="mt-6 bg-white text-indigo-600 border border-indigo-600 py-2 px-6 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              Validate Another Coupon
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
