"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallAppBanner() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already installed (standalone mode)
    const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(isInStandaloneMode);

    if (isInStandaloneMode) return;

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      setShowBanner(true);
      return;
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error("Install prompt error:", error);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem("installBannerDismissed", Date.now().toString());
  };

  // Don't show if already installed or dismissed recently
  useEffect(() => {
    const dismissed = localStorage.getItem("installBannerDismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const dayInMs = 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedTime < dayInMs * 7) {
        setShowBanner(false);
      }
    }
  }, []);

  if (isStandalone || !showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-4 mb-6 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">📱</span>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white mb-1" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" ? "অ্যাপ ইনস্টল করুন" : "Install Our App"}
          </h3>
          <p className="text-white/90 text-sm mb-3" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" 
              ? "হোম স্ক্রিনে যোগ করুন - দ্রুত অ্যাক্সেস পান" 
              : "Add to home screen for quick access"}
          </p>
          
          {isIOS ? (
            <div className="bg-white/20 rounded-xl p-3 text-white text-sm" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
              <p className="flex items-center gap-2">
                <span>1.</span>
                {language === "bn" ? "Safari এ Share বাটন ট্যাপ করুন" : "Tap the Share button in Safari"}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </p>
              <p className="flex items-center gap-2 mt-1">
                <span>2.</span>
                {language === "bn" ? "\"Add to Home Screen\" সিলেক্ট করুন" : "Select \"Add to Home Screen\""}
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-white text-emerald-600 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all hover:bg-emerald-50"
                style={{ fontFamily: "var(--font-bangla), sans-serif" }}
              >
                {language === "bn" ? "এখনই ইনস্টল করুন" : "Install Now"}
              </button>
              <button
                onClick={handleDismiss}
                className="bg-white/20 text-white py-2.5 px-4 rounded-xl text-sm"
              >
                {language === "bn" ? "পরে" : "Later"}
              </button>
            </div>
          )}
        </div>
        
        {!isIOS && (
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
