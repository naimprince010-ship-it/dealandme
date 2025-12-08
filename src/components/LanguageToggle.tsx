"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "bn" : "en")}
      className="flex items-center gap-1 px-2 py-1 text-sm rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
      title={language === "en" ? "Switch to Bangla" : "Switch to English"}
    >
      <span className="text-base">{language === "en" ? "🇧🇩" : "🇬🇧"}</span>
      <span className="font-medium">{language === "en" ? "BN" : "EN"}</span>
    </button>
  );
}
