"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/admin/dashboard" className="font-bold text-lg text-purple-600">
            Dealbox Admin
          </Link>
          <div className="flex items-center gap-1">
                        <Link
                          href="/admin/dashboard"
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            pathname === "/admin/dashboard"
                              ? "bg-purple-100 text-purple-700"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          Dashboard
                        </Link>
                                                <Link
                                                  href="/admin/home"
                                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive("/admin/home")
                                                      ? "bg-purple-100 text-purple-700"
                                                      : "text-gray-600 hover:bg-gray-100"
                                                  }`}
                                                >
                                                  Home Screen
                                                </Link>
                                                <Link
                                                  href="/admin/areas"
                                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    isActive("/admin/areas")
                                                      ? "bg-purple-100 text-purple-700"
                                                      : "text-gray-600 hover:bg-gray-100"
                                                  }`}
                                                >
                                                  Areas
                                                </Link>
                                                <Link
                                                  href="/admin/restaurants"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/admin/restaurants")
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Restaurants
            </Link>
            <Link
              href="/admin/offers"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/admin/offers")
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Offers
            </Link>
            <Link
              href="/admin/coupons"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/admin/coupons")
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Coupons
            </Link>
            <Link
              href="/admin/commissions"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/admin/commissions")
                  ? "bg-purple-100 text-purple-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Commissions
            </Link>
                        <Link
                          href="/admin/invoices"
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive("/admin/invoices")
                              ? "bg-purple-100 text-purple-700"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          Invoices
                        </Link>
                        <Link
                          href="/admin/analytics"
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive("/admin/analytics")
                              ? "bg-purple-100 text-purple-700"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          Analytics
                        </Link>
                        <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loggingOut ? "..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
