"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RestaurantNav from "@/components/RestaurantNav";
import { useLanguage } from "@/lib/LanguageContext";
import {
  getOffPeakStatus,
  formatOfferText,
  TITLE_SUGGESTIONS,
  TERMS_SUGGESTIONS,
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
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantNav />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => router.push("/restaurant/dashboard")}
            className="text-gray-600 hover:text-indigo-600 flex items-center gap-1"
          >
            <span>←</span>
            <span>{language === "bn" ? "ড্যাশবোর্ডে ফিরুন" : "Back to Dashboard"}</span>
          </button>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {language === "bn" ? "অফার সম্পাদনা করুন" : "Edit Offer"}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section - Takes 2 columns on desktop */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Discount Setup Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {language === "bn" ? "ডিসকাউন্ট সেটআপ" : "Discount Setup"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "bn" ? "ডিসকাউন্ট টাইপ" : "Discount Type"}
                    </label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "bn" ? "ডিসকাউন্ট মান" : "Discount Value"}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discountValue"
                        value={formData.discountValue}
                        onChange={handleInputChange}
                        placeholder={formData.discountType === "PERCENTAGE" ? "20" : "100"}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        step="0.01"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        {formData.discountType === "PERCENTAGE" ? "%" : "৳"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Max Discount Amount - Only for Percentage */}
                {formData.discountType === "PERCENTAGE" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === "bn"
                        ? "সর্বোচ্চ ডিসকাউন্ট পরিমাণ (ঐচ্ছিক)"
                        : "Maximum Discount Amount (optional)"}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="maxDiscountAmount"
                        value={formData.maxDiscountAmount}
                        onChange={handleInputChange}
                        placeholder="100"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        step="1"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                        ৳
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {language === "bn"
                        ? "উদাহরণ: ২০% ছাড় (সর্বোচ্চ ৳১০০)"
                        : "Example: 20% off (Up to ৳100)"}
                    </p>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {language === "bn" ? "অফার বিবরণ" : "Offer Details"}
                </h2>

                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {/* Quick Title Chips */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TITLE_SUGGESTIONS.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleTitleChipClick(suggestion)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm hover:bg-indigo-100 transition-colors"
                      >
                        {language === "bn" ? suggestion.bn : suggestion.en}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === "bn" ? "শর্তাবলী (ঐচ্ছিক)" : "Terms & Conditions (optional)"}
                  </label>
                  <textarea
                    name="terms"
                    value={formData.terms}
                    onChange={handleInputChange}
                    placeholder={
                      language === "bn"
                        ? "যেমন: শুধু ডাইন-ইন, ক্যাশ রিফান্ড নেই"
                        : "e.g., Dine-in Only, No Cash Refund"
                    }
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {/* Quick Terms Chips */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TERMS_SUGGESTIONS.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleTermsChipClick(suggestion)}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      >
                        {language === "bn" ? suggestion.bn : suggestion.en}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visuals Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {language === "bn" ? "ছবি" : "Photo"}
                </h2>

                {/* File Upload */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {language === "bn" ? "ছবি আপলোড করুন" : "Upload Photo"}
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        uploading ? "border-indigo-300 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"
                      }`}>
                        {uploading ? (
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                            <p className="text-sm text-indigo-600">
                              {language === "bn" ? "আপলোড হচ্ছে..." : "Uploading..."}
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="text-3xl mb-2">📷</div>
                            <p className="text-sm text-gray-600">
                              {language === "bn"
                                ? "ছবি নির্বাচন করতে ক্লিক করুন"
                                : "Click to select an image"}
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
                  </div>
                </div>

                {/* Current Photo Preview */}
                {formData.photoUrl && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {language === "bn" ? "বর্তমান ছবি" : "Current Photo"}
                    </p>
                    <div className="relative inline-block">
                      <img
                        src={formData.photoUrl}
                        alt="Current offer"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-200"
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
                <div className="border-t pt-4">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Off-Peak Boost Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {language === "bn" ? "অফ-পিক বুস্ট" : "Off-Peak Boost"}
                </h2>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-700">
                      {language === "bn"
                        ? "৩টা - ৬টা সময়ে বিশেষ দৃশ্যমানতা"
                        : "Special visibility during 3 PM - 6 PM"}
                    </p>
                    {offPeakBoost && (
                      <p
                        className={`text-sm mt-1 ${
                          offPeakStatus.isActive ? "text-green-600" : "text-yellow-600"
                        }`}
                      >
                        {offPeakStatus.isActive ? "🟢" : "🟡"}{" "}
                        {language === "bn" ? offPeakStatus.labelBn : offPeakStatus.label}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleOffPeakToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      offPeakBoost ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        offPeakBoost ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
              )}
              {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg">{success}</div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/restaurant/dashboard")}
                  className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  {language === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="flex-1 py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
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
                    ? "সংরক্ষণ করুন এবং সক্রিয় করুন"
                    : "Save & Activate"}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Section - Takes 1 column on desktop, shows below on mobile */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  {language === "bn" ? "লাইভ প্রিভিউ" : "Live Customer View"}
                </h2>

                {/* Preview Card */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
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

                  <div className="p-4">
                    {/* Offer Text */}
                    {previewOfferText && (
                      <div className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm mb-3 flex items-center">
                        <span className="mr-2">🎁</span>
                        <span className="font-medium">{previewOfferText}</span>
                      </div>
                    )}

                    {/* Title */}
                    {formData.title && !previewOfferText && (
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {formData.title}
                      </h3>
                    )}

                    {/* Description */}
                    {formData.description && (
                      <p className="text-sm text-gray-600 mb-3">
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
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-4xl mb-2">🎁</div>
                        <p className="text-sm">
                          {language === "bn"
                            ? "আপনার অফার এখানে দেখা যাবে"
                            : "Your offer will appear here"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-3 text-center">
                  {language === "bn"
                    ? "গ্রাহকরা এভাবে আপনার অফার দেখবে"
                    : "This is how customers will see your offer"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
