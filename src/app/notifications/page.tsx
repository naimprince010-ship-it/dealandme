"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
    }}>
      <LoginBackgroundPattern />
      
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {t("notifications", "title")}
          </h1>
        </div>

        {/* Empty State */}
        <div className="bg-white/90 rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {t("notifications", "noNotifications")}
          </h2>
          <p className="text-gray-500 mb-6" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {t("notifications", "noNotificationsDesc")}
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-emerald-600 font-medium"
            style={{ fontFamily: "var(--font-bangla), sans-serif" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t("notifications", "manageSettings")}
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
