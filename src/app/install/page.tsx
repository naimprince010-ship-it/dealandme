"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPage() {
  const { language, setLanguage } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "installed">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already installed
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(isInStandaloneMode);

    // Detect device
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    setInstallStatus("installing");
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setInstallStatus("installed");
      } else {
        setInstallStatus("idle");
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Install error:", error);
      setInstallStatus("idle");
    }
  };

  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(180deg, #7DD3C0 0%, #A8E6CF 30%, #F5F5F5 60%)"
    }}>
      {/* Header */}
      <div className="pt-6 pb-4 px-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link
            href="/"
            className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <button
            onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
            className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700"
          >
            {language === "bn" ? "EN" : "বাং"}
          </button>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 pb-8">
        {/* App Icon & Title */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-3xl shadow-lg overflow-hidden" style={{
            background: "linear-gradient(180deg, #7DD3C0 0%, #10B981 100%)"
          }}>
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-5xl font-bold text-white">D</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" ? "Dealandme অ্যাপ ইনস্টল করুন" : "Install Dealandme App"}
          </h1>
          <p className="text-gray-600" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" 
              ? "রেস্টুরেন্ট ডিসকাউন্ট পান সহজেই" 
              : "Get restaurant discounts easily"}
          </p>
        </div>

        {/* Already Installed */}
        {isStandalone && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-emerald-800 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "অ্যাপ ইনস্টল করা আছে!" : "App Already Installed!"}
            </h2>
            <p className="text-emerald-700" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" 
                ? "আপনি ইতিমধ্যে Dealandme অ্যাপ ব্যবহার করছেন" 
                : "You are already using the Dealandme app"}
            </p>
          </div>
        )}

        {/* Install Status: Installed */}
        {installStatus === "installed" && !isStandalone && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-emerald-800 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" ? "ইনস্টল সফল!" : "Installation Successful!"}
            </h2>
            <p className="text-emerald-700" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              {language === "bn" 
                ? "হোম স্ক্রিনে Dealandme আইকন দেখুন" 
                : "Find the Dealandme icon on your home screen"}
            </p>
          </div>
        )}

        {/* Android Install Button */}
        {!isStandalone && installStatus !== "installed" && deferredPrompt && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              <span className="text-2xl">🤖</span>
              {language === "bn" ? "Android এ ইনস্টল" : "Install on Android"}
            </h2>
            <button
              onClick={handleInstallClick}
              disabled={installStatus === "installing"}
              className="w-full py-4 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                fontFamily: "var(--font-bangla), sans-serif"
              }}
            >
              {installStatus === "installing" 
                ? (language === "bn" ? "ইনস্টল হচ্ছে..." : "Installing...")
                : (language === "bn" ? "এখনই ইনস্টল করুন" : "Install Now")}
            </button>
          </div>
        )}

        {/* iOS Instructions */}
        {!isStandalone && (isIOS || (!deferredPrompt && !isAndroid)) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              <span className="text-2xl">🍎</span>
              {language === "bn" ? "iPhone/iPad এ ইনস্টল" : "Install on iPhone/iPad"}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "Safari ব্রাউজারে খুলুন" : "Open in Safari browser"}
                  </p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "Chrome বা অন্য ব্রাউজার কাজ করবে না" : "Chrome or other browsers won't work"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "Share বাটন ট্যাপ করুন" : "Tap the Share button"}
                  </p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "স্ক্রিনের নিচে বা উপরে থাকবে" : "At the bottom or top of the screen"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "\"Add to Home Screen\" সিলেক্ট করুন" : "Select \"Add to Home Screen\""}
                  </p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "স্ক্রল করে খুঁজুন" : "Scroll to find it"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "\"Add\" ট্যাপ করুন" : "Tap \"Add\""}
                  </p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "হোম স্ক্রিনে আইকন যোগ হবে" : "Icon will be added to home screen"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Android Manual Instructions */}
        {!isStandalone && !deferredPrompt && isAndroid && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              <span className="text-2xl">🤖</span>
              {language === "bn" ? "Android এ ইনস্টল" : "Install on Android"}
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "Chrome এ মেনু খুলুন" : "Open Chrome menu"}
                  </p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "উপরে ডানে ⋮ আইকন" : "Three dots icon at top right"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "\"Install app\" বা \"Add to Home screen\" ট্যাপ করুন" : "Tap \"Install app\" or \"Add to Home screen\""}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "\"Install\" কনফার্ম করুন" : "Confirm \"Install\""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" ? "অ্যাপের সুবিধা" : "App Benefits"}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <p className="text-gray-700" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {language === "bn" ? "দ্রুত অ্যাক্সেস - এক ট্যাপে খুলুন" : "Quick access - open with one tap"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📴</span>
              </div>
              <p className="text-gray-700" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {language === "bn" ? "অফলাইনেও কাজ করে" : "Works offline too"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🔔</span>
              </div>
              <p className="text-gray-700" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {language === "bn" ? "নোটিফিকেশন পান" : "Get notifications"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">💾</span>
              </div>
              <p className="text-gray-700" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                {language === "bn" ? "কম স্টোরেজ লাগে" : "Uses less storage"}
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <Link
          href="/"
          className="block w-full py-4 text-center rounded-xl font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200"
          style={{ fontFamily: "var(--font-bangla), sans-serif" }}
        >
          {language === "bn" ? "হোমে ফিরে যান" : "Back to Home"}
        </Link>
      </main>
    </div>
  );
}
