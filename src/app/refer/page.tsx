"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import BottomNav from "@/components/BottomNav";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  bonusAwarded: number;
}

export default function ReferFriendPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchReferralData() {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push("/login");
          return;
        }

        const refRes = await fetch("/api/referral");
        if (refRes.ok) {
          const data = await refRes.json();
          setReferralData(data);
        }
      } catch (error) {
        console.error("Error fetching referral data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReferralData();
  }, [router]);

  const handleCopy = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (referralData?.referralCode && navigator.share) {
      navigator.share({
        title: "Dealandme",
        text: language === "bn" 
          ? `Dealandme এ জয়েন করুন এবং রেস্টুরেন্ট ডিসকাউন্ট পান! আমার রেফারেল কোড: ${referralData.referralCode}। প্রথম অর্ডারে ৫০% ছাড় পাবেন!`
          : `Join Dealandme and get restaurant discounts! My referral code: ${referralData.referralCode}. Get 50% OFF on your first order!`,
        url: referralData.referralLink,
      });
    } else if (referralData?.referralCode) {
      // Fallback to copy
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
      }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
    }}>
      <LoginBackgroundPattern />
      
      <main className="relative z-10 max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow-sm"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" ? "বন্ধুকে রেফার করুন" : "Refer a Friend"}
          </h1>
        </div>

        {/* Illustration - Gift Exchange */}
        <div className="flex justify-center mb-8">
          <div className="relative w-64 h-48">
            {/* Background blob */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 rounded-full blur-2xl"></div>
            
            {/* Two people exchanging gift */}
            <svg viewBox="0 0 300 200" className="w-full h-full relative z-10">
              {/* Left person (man in green) */}
              <g transform="translate(50, 30)">
                {/* Head */}
                <circle cx="40" cy="25" r="22" fill="#F5D0C5"/>
                {/* Hair */}
                <path d="M20 20 Q25 5 45 8 Q65 5 60 25" fill="#4A3728"/>
                {/* Eyes */}
                <circle cx="33" cy="25" r="2" fill="#333"/>
                <circle cx="47" cy="25" r="2" fill="#333"/>
                {/* Smile */}
                <path d="M33 35 Q40 42 47 35" stroke="#333" strokeWidth="2" fill="none"/>
                {/* Body (green shirt) */}
                <path d="M15 50 Q40 45 65 50 L70 120 L10 120 Z" fill="#4CAF50"/>
                {/* Arms */}
                <path d="M65 55 Q90 70 100 85" stroke="#F5D0C5" strokeWidth="12" strokeLinecap="round" fill="none"/>
                <path d="M15 55 Q5 70 0 90" stroke="#F5D0C5" strokeWidth="12" strokeLinecap="round" fill="none"/>
                {/* Hands */}
                <circle cx="100" cy="85" r="8" fill="#F5D0C5"/>
                {/* Legs (blue pants) */}
                <rect x="20" y="120" width="15" height="50" fill="#5C6BC0"/>
                <rect x="45" y="120" width="15" height="50" fill="#5C6BC0"/>
              </g>
              
              {/* Gift box in the middle */}
              <g transform="translate(125, 70)">
                {/* Box */}
                <rect x="0" y="20" width="50" height="40" fill="#E53935" rx="3"/>
                {/* Lid */}
                <rect x="-5" y="10" width="60" height="15" fill="#C62828" rx="3"/>
                {/* Ribbon vertical */}
                <rect x="20" y="10" width="10" height="50" fill="#FFC107"/>
                {/* Ribbon horizontal */}
                <rect x="0" y="30" width="50" height="10" fill="#FFC107"/>
                {/* Bow */}
                <ellipse cx="25" cy="10" rx="15" ry="8" fill="#FFC107"/>
                <ellipse cx="25" cy="10" rx="5" ry="4" fill="#FFD54F"/>
              </g>
              
              {/* Right person (woman in yellow) */}
              <g transform="translate(170, 30)">
                {/* Head */}
                <circle cx="40" cy="25" r="22" fill="#F5D0C5"/>
                {/* Hair */}
                <path d="M18 30 Q15 10 40 5 Q65 10 62 30 Q60 45 55 50 L25 50 Q20 45 18 30" fill="#5D4037"/>
                {/* Eyes */}
                <circle cx="33" cy="25" r="2" fill="#333"/>
                <circle cx="47" cy="25" r="2" fill="#333"/>
                {/* Smile */}
                <path d="M33 35 Q40 42 47 35" stroke="#333" strokeWidth="2" fill="none"/>
                {/* Body (yellow/orange top) */}
                <path d="M15 50 Q40 45 65 50 L70 120 L10 120 Z" fill="#FFB74D"/>
                {/* Arms */}
                <path d="M15 55 Q-10 70 -20 85" stroke="#F5D0C5" strokeWidth="12" strokeLinecap="round" fill="none"/>
                <path d="M65 55 Q75 70 80 90" stroke="#F5D0C5" strokeWidth="12" strokeLinecap="round" fill="none"/>
                {/* Hands */}
                <circle cx="-20" cy="85" r="8" fill="#F5D0C5"/>
                {/* Legs (blue pants) */}
                <rect x="20" y="120" width="15" height="50" fill="#5C6BC0"/>
                <rect x="45" y="120" width="15" height="50" fill="#5C6BC0"/>
              </g>
            </svg>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white/95 rounded-3xl shadow-lg p-6 mx-2">
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" ? "বন্ধুদের আমন্ত্রণ করুন, পুরস্কার পান!" : "Invite Friends, Get Rewards!"}
          </h2>
          
          {/* Description */}
          <p className="text-gray-600 text-center mb-6" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" 
              ? "আপনার কোড শেয়ার করুন। তারা প্রথম অর্ডার করলে, আপনি দুজনেই ৫০% ছাড় পাবেন!"
              : "Share your code. When they place their first order, you both get 50% OFF!"}
          </p>

          {/* Referral Code Label */}
          <p className="text-gray-700 font-medium mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
            {language === "bn" ? "আপনার রেফারেল কোড" : "Your Referral Code"}
          </p>

          {/* Referral Code Box */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 bg-white border-2 border-emerald-400 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-2xl font-bold text-gray-800 tracking-wider">
                {referralData?.referralCode || "------"}
              </span>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transition-colors"
                style={{ fontFamily: "var(--font-bangla), sans-serif" }}
              >
                {copied 
                  ? (language === "bn" ? "কপি হয়েছে!" : "Copied!") 
                  : (language === "bn" ? "কপি" : "Copy")}
              </button>
            </div>
          </div>

          {/* Share Now Button */}
          <button
            onClick={handleShare}
            className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all hover:shadow-xl active:scale-98"
            style={{
              background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
              fontFamily: "var(--font-bangla), sans-serif"
            }}
          >
            {language === "bn" ? "এখনই শেয়ার করুন" : "Share Now"}
          </button>

          {/* Stats (optional) */}
          {referralData && referralData.totalReferrals > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{referralData.totalReferrals}</p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "মোট রেফারেল" : "Total Referrals"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-500">{referralData.bonusAwarded}</p>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                    {language === "bn" ? "বোনাস পেয়েছেন" : "Bonuses Earned"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
