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

  const getShareText = () => {
    if (!referralData?.referralCode) return "";
    return language === "bn" 
      ? `Dealandme এ জয়েন করুন এবং রেস্টুরেন্ট ডিসকাউন্ট পান! আমার রেফারেল কোড: ${referralData.referralCode}। প্রথম অর্ডারে ৫০% ছাড় পাবেন!\n${referralData.referralLink}`
      : `Join Dealandme and get restaurant discounts! My referral code: ${referralData.referralCode}. Get 50% OFF on your first order!\n${referralData.referralLink}`;
  };

  const handleCopy = async () => {
    if (!referralData?.referralCode) return;
    
    const textToCopy = getShareText();
    
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(language === "bn" ? "কপি করতে পারলাম না" : "Could not copy");
    }
  };

  const handleNativeShare = async () => {
    if (!referralData?.referralCode) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Dealandme",
          text: getShareText(),
          url: referralData.referralLink,
        });
      } catch {
        // User cancelled or share failed - ignore
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsAppShare = () => {
    if (!referralData?.referralCode) return;
    const text = encodeURIComponent(getShareText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleMessengerShare = () => {
    if (!referralData?.referralLink) return;
    const link = encodeURIComponent(referralData.referralLink);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${link}&quote=${encodeURIComponent(getShareText())}`, "_blank");
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

                    {/* Share Buttons */}
                    <div className="space-y-3">
                      {/* WhatsApp Share Button */}
                      <button
                        onClick={handleWhatsAppShare}
                        className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all hover:shadow-xl active:scale-98 flex items-center justify-center gap-3"
                        style={{
                          background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                          fontFamily: "var(--font-bangla), sans-serif"
                        }}
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        {language === "bn" ? "WhatsApp এ শেয়ার করুন" : "Share on WhatsApp"}
                      </button>

                      {/* Facebook/Messenger Share Button */}
                      <button
                        onClick={handleMessengerShare}
                        className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all hover:shadow-xl active:scale-98 flex items-center justify-center gap-3"
                        style={{
                          background: "linear-gradient(135deg, #0084FF 0%, #0066CC 100%)",
                          fontFamily: "var(--font-bangla), sans-serif"
                        }}
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
                        </svg>
                        {language === "bn" ? "Facebook এ শেয়ার করুন" : "Share on Facebook"}
                      </button>

                      {/* Native Share Button (for TikTok, SMS, etc.) */}
                      <button
                        onClick={handleNativeShare}
                        className="w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all hover:shadow-xl active:scale-98 flex items-center justify-center gap-3"
                        style={{
                          background: "linear-gradient(135deg, #4CAF50 0%, #45a049 100%)",
                          fontFamily: "var(--font-bangla), sans-serif"
                        }}
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        {language === "bn" ? "অন্যান্য অ্যাপে শেয়ার করুন" : "Share to Other Apps"}
                      </button>
                    </div>

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
