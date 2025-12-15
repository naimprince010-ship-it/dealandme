"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";

interface Notification {
  id: string;
  type: string;
  title: string;
  titleBn: string | null;
  body: string;
  bodyBn: string | null;
  data: Record<string, string> | null;
  isGlobal: boolean;
  readAt: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_OFFER":
        return (
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <span className="text-xl">🎉</span>
          </div>
        );
      case "COUPON_EXPIRY":
        return (
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-xl">⏰</span>
          </div>
        );
      case "PROMO":
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-xl">🎁</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl">📢</span>
          </div>
        );
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === "bn" ? "এইমাত্র" : "Just now";
    if (diffMins < 60) return language === "bn" ? `${diffMins} মিনিট আগে` : `${diffMins}m ago`;
    if (diffHours < 24) return language === "bn" ? `${diffHours} ঘন্টা আগে` : `${diffHours}h ago`;
    if (diffDays < 7) return language === "bn" ? `${diffDays} দিন আগে` : `${diffDays}d ago`;
    return date.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US");
  };

  const getTitle = (notification: Notification) => {
    if (language === "bn" && notification.titleBn) {
      return notification.titleBn;
    }
    return notification.title;
  };

  const getBody = (notification: Notification) => {
    if (language === "bn" && notification.bodyBn) {
      return notification.bodyBn;
    }
    return notification.body;
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20 relative overflow-hidden" style={{
        background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
      }}>
        <LoginBackgroundPattern />
        <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
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
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/90 rounded-xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

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

        {notifications.length === 0 ? (
          /* Empty State */
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
        ) : (
          /* Notifications List */
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white/90 rounded-xl p-4 shadow-sm border border-gray-100 ${
                  !notification.readAt ? "border-l-4 border-l-emerald-500" : ""
                }`}
              >
                <div className="flex gap-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 mb-1" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                      {getTitle(notification)}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                      {getBody(notification)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
                {notification.data?.restaurantId && (
                  <Link
                    href={`/restaurants/${notification.data.restaurantId}`}
                    className="mt-3 block w-full py-2 text-center rounded-lg bg-emerald-50 text-emerald-600 font-medium text-sm"
                    style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                  >
                    {language === "bn" ? "অফার দেখুন" : "View Offer"}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
