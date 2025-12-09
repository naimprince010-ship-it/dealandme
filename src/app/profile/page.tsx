"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";

interface Badge {
  id: string;
  name: string;
  namebn: string;
  icon: string;
}

interface UserStats {
  couponsGenerated: number;
  couponsUsed: number;
  restaurantsTried: number;
  referralsCount: number;
  referralCode: string | null;
  badges: Badge[];
  phone?: string;
}

// All possible badges with their unlock criteria
const ALL_BADGES = [
  { id: "first_coupon", name: "First Coupon", namebn: "প্রথম কুপন", icon: "🏅", unlockAt: { couponsUsed: 1 } },
  { id: "coupon_lover", name: "Coupon Lover", namebn: "কুপন প্রেমী", icon: "👍", unlockAt: { couponsUsed: 5 } },
  { id: "deal_hunter", name: "Deal Hunter", namebn: "ডিল হান্টার", icon: "🛡️", unlockAt: { couponsUsed: 10 } },
  { id: "explorer", name: "Explorer", namebn: "এক্সপ্লোরার", icon: "🔒", unlockAt: { restaurantsTried: 5 } },
  { id: "foodie", name: "Foodie", namebn: "ফুডি", icon: "🔒", unlockAt: { restaurantsTried: 10 } },
  { id: "referral_star", name: "Referral Star", namebn: "রেফারেল স্টার", icon: "🔒", unlockAt: { referrals: 3 } },
];

export default function ProfilePage() {
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [userPhone, setUserPhone] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push("/login");
          return;
        }

        setUserPhone(authData.user?.phone || "");

        const [statsRes, pushRes] = await Promise.all([
          fetch("/api/user/stats"),
          fetch("/api/push-subscription"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (pushRes.ok) {
          const pushData = await pushRes.json();
          setNotificationsEnabled(pushData.subscribed);
        }

        // Check if push notifications are supported
        if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
          setNotificationsSupported(true);
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  const toggleNotifications = async () => {
    if (!notificationsSupported) return;

    setNotificationsLoading(true);
    try {
      if (notificationsEnabled) {
        // Unsubscribe
        const res = await fetch("/api/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          setNotificationsEnabled(false);
        }
      } else {
        // Request permission and subscribe
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert(language === "bn" 
            ? "নোটিফিকেশন পারমিশন দিন" 
            : "Please allow notification permission");
          setNotificationsLoading(false);
          return;
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
          ),
        });

        // Send subscription to server
        const res = await fetch("/api/push-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
              auth: arrayBufferToBase64(subscription.getKey("auth")),
            },
          }),
        });

        if (res.ok) {
          setNotificationsEnabled(true);
        }
      }
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Helper functions for push subscription
  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function arrayBufferToBase64(buffer: ArrayBuffer | null) {
    if (!buffer) return "";
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Get unlocked badges based on stats
  const getUnlockedBadgeIds = () => {
    if (!stats) return new Set<string>();
    const unlocked = new Set<string>();
    
    ALL_BADGES.forEach(badge => {
      const criteria = badge.unlockAt;
      if (criteria.couponsUsed && stats.couponsUsed >= criteria.couponsUsed) {
        unlocked.add(badge.id);
      }
      if (criteria.restaurantsTried && stats.restaurantsTried >= criteria.restaurantsTried) {
        unlocked.add(badge.id);
      }
      if (criteria.referrals && stats.referralsCount >= criteria.referrals) {
        unlocked.add(badge.id);
      }
    });
    
    return unlocked;
  };

  const unlockedBadgeIds = getUnlockedBadgeIds();

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

  const phoneLastFour = userPhone.slice(-4);

  return (
    <div className="min-h-screen pb-20" style={{ background: "linear-gradient(180deg, #7DD3C0 0%, #A8E6CF 30%, #F5F5F5 60%)" }}>
      {/* Profile Header with Gradient */}
      <div className="pt-8 pb-6 px-4">
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            {/* Camera icon for edit */}
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          
          {/* User Name and Phone */}
          <h1 className="mt-4 text-xl font-bold text-gray-800">
            {language === "bn" ? `হ্যালো, ...${phoneLastFour}!` : `Hello, ...${phoneLastFour}!`}
          </h1>
          <p className="text-gray-600 text-sm">
            +01X:XXXXXXXXXX
          </p>
        </div>

        {/* Stats Grid - 2x2 */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {/* Coupons Used */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats?.couponsUsed || 0}</div>
              <div className="text-xs text-gray-500">{language === "bn" ? "কুপন ব্যবহার" : "Coupons Used"}</div>
            </div>
          </div>

          {/* Restaurants Visited */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats?.restaurantsTried || 0}</div>
              <div className="text-xs text-gray-500">{language === "bn" ? "রেস্টুরেন্ট ভিজিট" : "Restaurants Visited"}</div>
            </div>
          </div>

          {/* Coupons Generated */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats?.couponsGenerated || 0}</div>
              <div className="text-xs text-gray-500">{language === "bn" ? "কুপন তৈরি" : "Coupons Generated"}</div>
            </div>
          </div>

          {/* Referrals */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{stats?.referralsCount || 0}</div>
              <div className="text-xs text-gray-500">{language === "bn" ? "রেফারেল" : "Referrals"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="px-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          {language === "bn" ? "আপনার ব্যাজ" : "Your Badges"}
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {ALL_BADGES.map((badge) => {
            const isUnlocked = unlockedBadgeIds.has(badge.id);
            return (
              <div
                key={badge.id}
                className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${
                  isUnlocked 
                    ? "bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300" 
                    : "bg-gray-200"
                }`}
              >
                {isUnlocked ? (
                  <span className="text-3xl">{badge.icon}</span>
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Settings Menu List */}
      <div className="px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Favorites */}
          <Link href="/favorites" className="flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50">
            <div className="flex items-center gap-3">
              <span className="text-xl">❤️</span>
              <span className="text-gray-800">{language === "bn" ? "পছন্দের তালিকা" : "Favorites"}</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Notification Settings */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <span className="text-gray-800">{language === "bn" ? "নোটিফিকেশন সেটিংস" : "Notification Settings"}</span>
            </div>
            <div className="flex items-center gap-2">
              {notificationsSupported && (
                <button
                  onClick={toggleNotifications}
                  disabled={notificationsLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationsEnabled ? "bg-emerald-500" : "bg-gray-300"
                  } ${notificationsLoading ? "opacity-50" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationsEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Refer a Friend */}
          <button 
            onClick={() => router.push("/refer")}
            className="w-full flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🎁</span>
              <span className="text-gray-800">{language === "bn" ? "বন্ধুকে রেফার করুন" : "Refer a Friend"}</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Language Change */}
          <div className="relative">
            <button 
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="w-full flex items-center justify-between p-4 active:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🌐</span>
                <span className="text-gray-800">{language === "bn" ? "ভাষা পরিবর্তন" : "Change Language"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{language === "bn" ? "বাংলা" : "English"}</span>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {/* Language Dropdown */}
            {showLanguageDropdown && (
              <div className="absolute right-4 bottom-full mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                <button
                  onClick={() => { setLanguage("bn"); setShowLanguageDropdown(false); }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${language === "bn" ? "bg-emerald-50 text-emerald-600" : ""}`}
                >
                  বাংলা
                </button>
                <button
                  onClick={() => { setLanguage("en"); setShowLanguageDropdown(false); }}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 ${language === "en" ? "bg-emerald-50 text-emerald-600" : ""}`}
                >
                  English
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full mt-4 py-4 bg-red-500 text-white font-semibold rounded-2xl hover:bg-red-600 transition-colors"
        >
          {language === "bn" ? "লগআউট" : "Logout"}
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
