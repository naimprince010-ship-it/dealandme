"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Coupon {
  id: string;
  code: string;
  status: string;
  effectiveStatus: string;
  createdAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  restaurant: {
    name: string;
    area: string;
  };
  offer: {
    offerText: string;
  };
}

export default function MyCouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCoupons() {
      try {
        // Check auth first
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push("/login?redirect=/my-coupons");
          return;
        }

        // Fetch coupons
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UNUSED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        );
      case "USED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Used
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-orange-500">
            Dealbox
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/restaurants" className="text-sm text-gray-600 hover:text-orange-500">
              Restaurants
            </Link>
            <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-orange-500">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Coupons</h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {coupons.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎟️</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No coupons yet
            </h2>
            <p className="text-gray-500 mb-6">
              Browse restaurants and get your first coupon!
            </p>
            <Link
              href="/restaurants"
              className="inline-block bg-orange-500 text-white py-2 px-6 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Browse Restaurants
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white rounded-lg shadow-sm border p-4 ${
                  coupon.effectiveStatus === "UNUSED"
                    ? "border-green-200"
                    : "border-gray-100 opacity-75"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {coupon.restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-500">{coupon.restaurant.area}</p>
                  </div>
                  {getStatusBadge(coupon.effectiveStatus)}
                </div>

                <div className="bg-gray-50 rounded-md p-3 mb-3">
                  <p className="text-sm text-gray-600">
                    🎁 {coupon.offer.offerText}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div
                    className={`font-mono text-lg font-bold ${
                      coupon.effectiveStatus === "UNUSED"
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {coupon.code}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Created: {formatDate(coupon.createdAt)}</p>
                    {coupon.effectiveStatus === "USED" && coupon.redeemedAt && (
                      <p>Redeemed: {formatDate(coupon.redeemedAt)}</p>
                    )}
                    {coupon.effectiveStatus === "UNUSED" && (
                      <p className="text-orange-600">
                        Expires: {formatDate(coupon.expiresAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
