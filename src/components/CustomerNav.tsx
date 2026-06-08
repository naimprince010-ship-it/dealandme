"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageToggle from "./LanguageToggle";

export default function CustomerNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/restaurants" className="font-bold text-lg text-indigo-600">
            {t("appName", "en")}
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/restaurants"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/restaurants")
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("nav", "restaurants")}
            </Link>
            <Link
              href="/my-coupons"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/my-coupons")
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("nav", "myCoupons")}
            </Link>
            <Link
              href="/flights"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/flights")
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("nav", "flights")}
            </Link>
            <Link
              href="/hotels"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/hotels")
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("nav", "hotels")}
            </Link>
            <Link
              href="/profile"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/profile")
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t("profile", "title")}
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loggingOut ? "..." : t("nav", "logout")}
            </button>
            <LanguageToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
