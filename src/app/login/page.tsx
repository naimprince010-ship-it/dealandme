"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import LoginLogoMark from "@/components/LoginLogoMark";
import LoginBackgroundPattern from "@/components/LoginBackgroundPattern";
import InstallAppBanner from "@/components/InstallAppBanner";

export default function CustomerLogin() {
  const router = useRouter();
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Validate phone number: must start with 1 and be 10 digits total (1XXXXXXXXX)
  const isValidPhone = /^1[3-9]\d{8}$/.test(phone);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPhone) return;
    
    setLoading(true);
    setError("");

    try {
      // Send phone with +880 prefix
      const fullPhone = `+880${phone}`;
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fullPhone = `+880${phone}`;
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #f9f5ec 0%, #e8f4f0 50%, #d4ebe5 100%)"
    }}>
      {/* Background Pattern */}
      <LoginBackgroundPattern />
      
      {/* Language Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageToggle />
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <LoginLogoMark />
          </div>

          {/* Install App Banner */}
          <div className="mb-6">
            <InstallAppBanner />
          </div>

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/60 p-8">
            {step === "phone" ? (
              <>
                {/* Welcome Text */}
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                  {t("login", "welcome")}
                </h1>
                <p className="text-center text-gray-600 mb-8" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                  {t("login", "subtitle")}
                </p>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Phone Input Form */}
                <form onSubmit={handleRequestOtp}>
                  <div className="mb-6">
                    <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                                            {/* Country Code */}
                                            <div className="flex items-center px-4 py-3 bg-gray-50 border-r border-gray-200">
                                              <span className="text-xl mr-2">🇧🇩</span>
                                              <span className="text-gray-700 font-medium">{t("login", "countryCode")}</span>
                                            </div>
                      {/* Phone Input */}
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 10) {
                            setPhone(value);
                          }
                        }}
                        placeholder={t("login", "phonePlaceholder")}
                        className="flex-1 px-4 py-3 text-lg focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !isValidPhone}
                    className="w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: isValidPhone && !loading 
                        ? "linear-gradient(135deg, #5BA88B 0%, #4A9A7C 100%)" 
                        : "#d1d5db",
                      color: isValidPhone && !loading ? "white" : "#9ca3af",
                      fontFamily: "var(--font-bangla), sans-serif"
                    }}
                  >
                    {loading ? t("login", "sending") : t("login", "sendOtp")}
                  </button>
                </form>

                {/* Terms Text */}
                <p className="text-center text-gray-500 text-sm mt-6" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                  {t("login", "termsText")}
                </p>
              </>
            ) : (
              <>
                {/* OTP Step */}
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                  {t("login", "otpTitle")}
                </h1>
                <p className="text-center text-gray-600 mb-2" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                  {t("login", "otpSubtitle")}
                </p>
                <p className="text-center text-gray-600 mb-6">
                  <span className="font-medium">+880{phone}</span>
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="ml-2 text-emerald-600 hover:underline"
                    style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                  >
                    {t("login", "change")}
                  </button>
                </p>

                {/* Error Message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* OTP Input Form */}
                <form onSubmit={handleVerifyOtp}>
                  <div className="mb-6">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 6) {
                          setOtp(value);
                        }
                      }}
                      placeholder={t("login", "otpPlaceholder")}
                      className="w-full px-4 py-4 border border-gray-200 rounded-xl text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      maxLength={6}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: otp.length === 6 && !loading 
                        ? "linear-gradient(135deg, #5BA88B 0%, #4A9A7C 100%)" 
                        : "#d1d5db",
                      color: otp.length === 6 && !loading ? "white" : "#9ca3af",
                      fontFamily: "var(--font-bangla), sans-serif"
                    }}
                  >
                    {loading ? t("login", "verifying") : t("login", "verifyOtp")}
                  </button>
                </form>

                {/* Test OTP Hint */}
                <p className="text-center text-gray-500 text-sm mt-6" style={{ fontFamily: "var(--font-bangla), sans-serif" }}>
                  {t("login", "testOtpHint")}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
