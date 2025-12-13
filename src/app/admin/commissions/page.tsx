"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

interface RestaurantCommission {
  restaurantId: string;
  restaurantName: string;
  area: string;
  commissionRate: number;
  isInTrial: boolean;
  trialEndDate: string | null;
  totalRedeemed: number;
  totalCommission: number;
  paidCoupons: number;
  unpaidCoupons: number;
  unpaidAmount: number;
}

interface CommissionData {
  month: string;
  restaurants: RestaurantCommission[];
  totals: {
    totalRedeemed: number;
    totalCommission: number;
    totalUnpaid: number;
  };
}

export default function CommissionsPage() {
  const router = useRouter();
  const [data, setData] = useState<CommissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [marking, setMarking] = useState<string | null>(null);

  function getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function getMonthOptions(): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
    }
    return months;
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const authData = await res.json();

        if (!authData.authenticated || authData.user?.type !== "ADMIN") {
          router.push("/admin/login");
          return;
        }

        fetchCommissions();
      } catch {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/commissions?month=${selectedMonth}`);
      if (res.ok) {
        const commissionData = await res.json();
        setData(commissionData);
      }
    } catch (error) {
      console.error("Fetch commissions error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      fetchCommissions();
    }
  }, [selectedMonth]);

  const markAsPaid = async (restaurantId: string) => {
    setMarking(restaurantId);
    try {
      const res = await fetch("/api/admin/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId, month: selectedMonth }),
      });

      if (res.ok) {
        fetchCommissions();
      }
    } catch (error) {
      console.error("Mark as paid error:", error);
    } finally {
      setMarking(null);
    }
  };

  const formatMonth = (month: string): string => {
    const [year, m] = month.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[parseInt(m) - 1]} ${year}`;
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Commission Billing</h1>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            {getMonthOptions().map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">Total Redeemed</p>
              <p className="text-3xl font-bold text-indigo-600">{data.totals.totalRedeemed}</p>
              <p className="text-sm text-gray-400">coupons</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">Total Commission</p>
              <p className="text-3xl font-bold text-green-600">৳{data.totals.totalCommission.toFixed(0)}</p>
              <p className="text-sm text-gray-400">for {formatMonth(selectedMonth)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <p className="text-sm text-gray-500 mb-1">Unpaid Amount</p>
              <p className="text-3xl font-bold text-red-600">৳{data.totals.totalUnpaid.toFixed(0)}</p>
              <p className="text-sm text-gray-400">pending collection</p>
            </div>
          </div>
        )}

        {/* Restaurant Commission Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Restaurant Commissions</h2>
          </div>

          {data && data.restaurants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restaurant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Redeemed
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unpaid
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.restaurants.map((restaurant) => (
                    <tr key={restaurant.restaurantId} className={`hover:bg-gray-50 ${restaurant.isInTrial ? "bg-blue-50" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{restaurant.restaurantName}</div>
                        {restaurant.isInTrial && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            Trial until {new Date(restaurant.trialEndDate!).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {restaurant.area}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-indigo-600 font-semibold">{restaurant.totalRedeemed}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                        {restaurant.isInTrial ? (
                          <span className="line-through">৳{restaurant.commissionRate}</span>
                        ) : (
                          <span>৳{restaurant.commissionRate}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {restaurant.isInTrial ? (
                          <span className="font-semibold text-blue-600">৳0 (Trial)</span>
                        ) : (
                          <span className="font-semibold text-green-600">৳{restaurant.totalCommission}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {restaurant.isInTrial ? (
                          <span className="text-blue-600">Trial</span>
                        ) : restaurant.unpaidAmount > 0 ? (
                          <span className="text-red-600 font-semibold">৳{restaurant.unpaidAmount}</span>
                        ) : (
                          <span className="text-green-600">Paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {restaurant.isInTrial ? (
                          <span className="text-blue-500 text-sm">Free</span>
                        ) : restaurant.unpaidAmount > 0 ? (
                          <button
                            onClick={() => markAsPaid(restaurant.restaurantId)}
                            disabled={marking === restaurant.restaurantId}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            {marking === restaurant.restaurantId ? "..." : "Mark Paid"}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              No commission data for {formatMonth(selectedMonth)}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Manual Billing Process</h3>
          <ul className="text-blue-700 space-y-1 text-sm">
            <li>1. Review the commission amounts for each restaurant</li>
            <li>2. Collect payment from restaurants (cash, bank transfer, bKash, etc.)</li>
            <li>3. Click &quot;Mark Paid&quot; after receiving payment</li>
            <li>4. Commission records are stored for future reference</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
