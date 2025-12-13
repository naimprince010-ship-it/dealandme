"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import {
  getOffPeakStatus,
  formatOfferText,
  TITLE_SUGGESTIONS,
  TERMS_SUGGESTIONS,
  APPLIES_TO_OPTIONS,
  OfferAppliesToType,
} from "@/lib/offer";

interface Offer {
  id: string;
  offerText: string;
  isActive: boolean;
  discountType: "PERCENTAGE" | "FLAT" | null;
  discountValue: number | null;
  maxDiscountAmount: number | null;
  title: string | null;
  description: string | null;
  terms: string | null;
  photoUrl: string | null;
  appliesTo: OfferAppliesToType | null;
}

interface FormData {
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: string;
  maxDiscountAmount: string;
  title: string;
  description: string;
  terms: string;
  photoUrl: string;
  isActive: boolean;
  appliesTo: OfferAppliesToType;
}

export default function EditOfferPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [offPeakBoost, setOffPeakBoost] = useState(false);
  const [offPeakStatus, setOffPeakStatus] = useState(getOffPeakStatus(false));

  const [formData, setFormData] = useState<FormData>({
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscountAmount: "",
    title: "",
    description: "",
    terms: "",
    photoUrl: "",
    isActive: true,
    appliesTo: "TOTAL_BILL",
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.authenticated || data.user?.type !== "RESTAURANT") {
          router.push("/restaurant/login");
          return;
        }

        // Fetch current offer
        const offerRes = await fetch("/api/restaurant/offer");
        const offerData = await offerRes.json();

        if (offerRes.ok) {
          setOffPeakBoost(offerData.offPeakBoost || false);
          setOffPeakStatus(getOffPeakStatus(offerData.offPeakBoost || false));

          if (offerData.offer) {
            const offer: Offer = offerData.offer;
            setFormData({
              discountType: offer.discountType || "PERCENTAGE",
              discountValue: offer.discountValue?.toString() || "",
              maxDiscountAmount: offer.maxDiscountAmount?.toString() || "",
              title: offer.title || "",
              description: offer.description || "",
              terms: offer.terms || "",
              photoUrl: offer.photoUrl || "",
              isActive: offer.isActive,
              appliesTo: offer.appliesTo || "TOTAL_BILL",
            });
          }
        }
      } catch {
        setError("Failed to load offer data");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Update off-peak status every minute
    const interval = setInterval(() => {
      setOffPeakStatus(getOffPeakStatus(offPeakBoost));
    }, 60000);

    return () => clearInterval(interval);
  }, [router, offPeakBoost]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleTitleChipClick = (suggestion: { en: string; bn: string }) => {
    const text = language === "bn" ? suggestion.bn : suggestion.en;
    setFormData((prev) => ({
      ...prev,
      title: prev.title ? `${prev.title} ${text}` : text,
    }));
  };

  const handleTermsChipClick = (suggestion: { en: string; bn: string }) => {
    const text = language === "bn" ? suggestion.bn : suggestion.en;
    setFormData((prev) => ({
      ...prev,
      terms: prev.terms ? `${prev.terms}, ${text}` : text,
    }));
  };

  const handleOffPeakToggle = async () => {
    const newValue = !offPeakBoost;
    setOffPeakBoost(newValue);
    setOffPeakStatus(getOffPeakStatus(newValue));

    try {
      await fetch("/api/restaurant/offer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offPeakBoost: newValue }),
      });
    } catch {
      // Revert on error
      setOffPeakBoost(!newValue);
      setOffPeakStatus(getOffPeakStatus(!newValue));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError(language === "bn" ? "শুধুমাত্র ছবি ফাইল অনুমোদিত" : "Only image files are allowed");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(language === "bn" ? "ফাইল সাইজ ৫MB এর কম হতে হবে" : "File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/restaurant/offer/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Set the uploaded URL to form data
      setFormData((prev) => ({
        ...prev,
        photoUrl: data.url,
      }));

      setSuccess(language === "bn" ? "ছবি আপলোড সফল!" : "Image uploaded successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        discountType: formData.discountType,
        discountValue: formData.discountValue ? parseFloat(formData.discountValue) : null,
        maxDiscountAmount:
          formData.discountType === "PERCENTAGE" && formData.maxDiscountAmount
            ? parseFloat(formData.maxDiscountAmount)
            : null,
        title: formData.title || null,
        description: formData.description || null,
        terms: formData.terms || null,
        photoUrl: formData.photoUrl || null,
        isActive: formData.isActive,
        appliesTo: formData.appliesTo,
      };

      const res = await fetch("/api/restaurant/offer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save offer");
      }

      setSuccess(language === "bn" ? "অফার সফলভাবে সংরক্ষিত হয়েছে!" : "Offer saved successfully!");
      
      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push("/restaurant/dashboard");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save offer");
    } finally {
      setSaving(false);
    }
  };

  // Generate preview text
  const previewOfferText = formatOfferText({
    discountType: formData.discountType,
    discountValue: formData.discountValue ? parseFloat(formData.discountValue) : null,
    maxDiscountAmount:
      formData.discountType === "PERCENTAGE" && formData.maxDiscountAmount
        ? parseFloat(formData.maxDiscountAmount)
        : null,
    title: formData.title,
    appliesTo: formData.appliesTo,
  });

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

  return (
    <div className="min-h-screen pb-24" style={{ background: "linear-gradient(180deg, #7DD3C0 0%, #A8E6CF 30%, #F5F5F5 60%)" }}>
      {/* Header */}
      <div className="pt-6 pb-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/restaurant/dashboard")}
              className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-sm"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {language === "bn" ? "অফার সম্পাদনা" : "Edit Offer"}
              </h1>
              <p className="text-gray-600 text-sm">
                {language === "bn" ? "আপনার ডিসকাউন্ট কাস্টমাইজ করুন" : "Customize your discount"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Discount Setup Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>💰</span>
              {language === "bn" ? "ডিসকাউন্ট সেটআপ" : "Discount Setup"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {language === "bn" ? "ডিসকাউন্ট টাইপ" : "Discount Type"}
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                >
                  <option value="PERCENTAGE">
                    {language === "bn" ? "শতাংশ (%)" : "Percentage (%)"}
                  </option>
                  <option value="FLAT">
                    {language === "bn" ? "নির্দিষ্ট পরিমাণ (৳)" : "Flat Amount (৳)"}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {language === "bn" ? "ডিসকাউন্ট মান" : "Discount Value"}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                    placeholder={formData.discountType === "PERCENTAGE" ? "20" : "100"}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    min="0"
                    step="0.01"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    {formData.discountType === "PERCENTAGE" ? "%" : "৳"}
                  </span>
                </div>
              </div>

              {/* Max Discount Amount - Only for Percentage */}
              {formData.discountType === "PERCENTAGE" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {language === "bn"
                      ? "সর্বোচ্চ ডিসকাউন্ট (ঐচ্ছিক)"
                      : "Max Discount (optional)"}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="maxDiscountAmount"
                      value={formData.maxDiscountAmount}
                      onChange={handleInputChange}
                      placeholder="100"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                      min="0"
                      step="1"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      ৳
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {language === "bn"
                      ? "উদাহরণ: ২০% ছাড় (সর্বোচ্চ ৳১০০)"
                      : "Example: 20% off (Up to ৳100)"}
                  </p>
                </div>
              )}

              {/* Discount Applies To */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {language === "bn" ? "ডিসকাউন্ট প্রযোজ্য" : "Discount Applies To"}
                </label>
                <select
                  name="appliesTo"
                  value={formData.appliesTo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                >
                  {APPLIES_TO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {language === "bn" ? option.bn : option.en}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500">
                  {language === "bn"
                    ? "কাস্টমার দেখবে: ৳50 off on total bill"
                    : "Customer will see: ৳50 off on total bill"}
                </p>
              </div>
            </div>
          </div>

          {/* Offer Details Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>📝</span>
              {language === "bn" ? "অফার বিবরণ" : "Offer Details"}
            </h2>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {language === "bn" ? "অফার শিরোনাম" : "Offer Title"}
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder={
                    language === "bn" ? "যেমন: ফ্ল্যাট ৫০% ছাড়" : "e.g., Flat 50% Off"
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                />
                <p className="mt-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                  {language === "bn"
                    ? "এটি শুধু তখন দেখাবে যখন উপরে ডিসকাউন্ট ০ থাকবে"
                    : "Only shows when discount is 0 above"}
                </p>
                {/* Quick Title Chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {TITLE_SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTitleChipClick(suggestion)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs hover:bg-emerald-100 transition-colors"
                    >
                      {language === "bn" ? suggestion.bn : suggestion.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {language === "bn" ? "বিবরণ (ঐচ্ছিক)" : "Description (optional)"}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder={
                    language === "bn"
                      ? "অফার সম্পর্কে আরও বিস্তারিত..."
                      : "More details about the offer..."
                  }
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
                />
              </div>

              {/* Terms */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  {language === "bn" ? "শর্তাবলী (ঐচ্ছিক)" : "Terms (optional)"}
                </label>
                <textarea
                  name="terms"
                  value={formData.terms}
                  onChange={handleInputChange}
                  placeholder={
                    language === "bn"
                      ? "যেমন: শুধু ডাইন-ইন"
                      : "e.g., Dine-in Only"
                  }
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
                />
                {/* Quick Terms Chips */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {TERMS_SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleTermsChipClick(suggestion)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200 transition-colors"
                    >
                      {language === "bn" ? suggestion.bn : suggestion.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Photo Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>📷</span>
              {language === "bn" ? "ছবি" : "Photo"}
            </h2>

            {/* File Upload */}
            <label className="block cursor-pointer mb-3">
              <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                uploading ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-emerald-400"
              }`}>
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                    <p className="text-sm text-emerald-600">
                      {language === "bn" ? "আপলোড হচ্ছে..." : "Uploading..."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl mb-1">📷</div>
                    <p className="text-sm text-gray-600">
                      {language === "bn"
                        ? "ছবি নির্বাচন করতে ট্যাপ করুন"
                        : "Tap to select an image"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {language === "bn" ? "সর্বোচ্চ ৫MB" : "Max 5MB"}
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {/* Current Photo Preview */}
            {formData.photoUrl && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-2">
                  {language === "bn" ? "বর্তমান ছবি" : "Current Photo"}
                </p>
                <div className="relative inline-block">
                  <img
                    src={formData.photoUrl}
                    alt="Current offer"
                    className="w-24 h-24 object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, photoUrl: "" }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* URL Input (Alternative) */}
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-2">
                {language === "bn"
                  ? "অথবা সরাসরি URL দিন:"
                  : "Or enter URL directly:"}
              </p>
              <input
                type="url"
                name="photoUrl"
                value={formData.photoUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          {/* Off-Peak Boost Card */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                  <span>🚀</span>
                  {language === "bn" ? "অফ-পিক বুস্ট" : "Off-Peak Boost"}
                </h3>
                <p className="text-orange-700 text-xs mt-1">
                  {language === "bn" 
                    ? "৩-৬টায় আপনার রেস্টুরেন্ট সবার আগে দেখাবে" 
                    : "Get priority visibility during 3-6pm"}
                </p>
                {offPeakBoost && (
                  <p className={`text-xs mt-1.5 ${offPeakStatus.isActive ? "text-green-600" : "text-yellow-600"}`}>
                    {offPeakStatus.isActive ? "🟢" : "🟡"}{" "}
                    {language === "bn" ? offPeakStatus.labelBn : offPeakStatus.label}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleOffPeakToggle}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  offPeakBoost ? "bg-orange-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    offPeakBoost ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span>👁️</span>
              {language === "bn" ? "লাইভ প্রিভিউ" : "Live Preview"}
            </h2>

            {/* Preview Card */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              {/* Photo Preview */}
              {formData.photoUrl && (
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={formData.photoUrl}
                    alt="Offer preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="p-3">
                {/* Offer Text */}
                {previewOfferText && (
                  <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm mb-2 flex items-center">
                    <span className="mr-2">🎁</span>
                    <span className="font-medium">{previewOfferText}</span>
                  </div>
                )}

                {/* Title */}
                {formData.title && !previewOfferText && (
                  <h3 className="font-semibold text-gray-800 mb-2 text-sm">
                    {formData.title}
                  </h3>
                )}

                {/* Description */}
                {formData.description && (
                  <p className="text-xs text-gray-600 mb-2">
                    {formData.description}
                  </p>
                )}

                {/* Terms */}
                {formData.terms && (
                  <div className="text-xs text-gray-500 border-t pt-2">
                    <span className="font-medium">
                      {language === "bn" ? "শর্তাবলী: " : "Terms: "}
                    </span>
                    {formData.terms}
                  </div>
                )}

                {/* Empty State */}
                {!previewOfferText && !formData.title && !formData.description && (
                  <div className="text-center py-4 text-gray-400">
                    <div className="text-3xl mb-2">🎁</div>
                    <p className="text-xs">
                      {language === "bn"
                        ? "আপনার অফার এখানে দেখা যাবে"
                        : "Your offer will appear here"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
              {language === "bn"
                ? "গ্রাহকরা এভাবে আপনার অফার দেখবে"
                : "This is how customers will see your offer"}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>
          )}
          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm">{success}</div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/restaurant/dashboard")}
              className="flex-1 py-3.5 px-4 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-white transition-colors text-sm"
            >
              {language === "bn" ? "বাতিল" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 py-3.5 px-4 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:bg-emerald-300 transition-colors text-sm"
            >
              {saving
                ? language === "bn"
                  ? "সংরক্ষণ হচ্ছে..."
                  : "Saving..."
                : uploading
                ? language === "bn"
                  ? "আপলোড হচ্ছে..."
                  : "Uploading..."
                : language === "bn"
                ? "সংরক্ষণ করুন"
                : "Save Offer"}
            </button>
          </div>
        </form>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="max-w-lg mx-auto flex justify-around">
          <Link href="/restaurant/dashboard" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
              {language === "bn" ? "হোম" : "Home"}
            </span>
          </Link>
          <Link href="/restaurant/validate" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
              {language === "bn" ? "ভেরিফাই" : "Validate"}
            </span>
          </Link>
          <Link href="/restaurant/history" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
              {language === "bn" ? "হিস্ট্রি" : "History"}
            </span>
          </Link>
          <Link href="/restaurant/billing" className="flex flex-col items-center py-2 px-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs mt-1 text-gray-500">
              {language === "bn" ? "বিলিং" : "Billing"}
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
