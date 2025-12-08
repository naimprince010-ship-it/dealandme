"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function CouponUsageGuide() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-indigo-100 transition-colors"
      >
        <span className="font-medium text-indigo-700 flex items-center gap-2">
          <span className="text-lg">?</span>
          {t("couponGuide", "title")}
        </span>
        <svg
          className={`w-5 h-5 text-indigo-600 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div className="pt-1">
              <p className="text-gray-700">{t("couponGuide", "step1")}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div className="pt-1">
              <p className="text-gray-700">{t("couponGuide", "step2")}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div className="pt-1">
              <p className="text-gray-700">{t("couponGuide", "step3")}</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              {t("couponGuide", "note")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
