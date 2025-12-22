"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ReferralSettings {
  promoTextEn: string;
  promoTextBn: string;
  shareTextEn: string;
  shareTextBn: string;
  pointsPerReferral: number;
}

export default function ReferralSettingsPage() {
  const router = useRouter();
    const [settings, setSettings] = useState<ReferralSettings>({
      promoTextEn: "",
      promoTextBn: "",
      shareTextEn: "",
      shareTextBn: "",
      pointsPerReferral: 10,
    });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/referral-settings");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/referral-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Settings saved successfully" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save settings" });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/home")}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Referral Promo Settings</h1>
          <p className="text-gray-600 mb-6">
            Customize the promotional text shown on the Refer a Friend page and in share messages.
            Use <code className="bg-gray-100 px-1 rounded">{"{code}"}</code> in share text to insert the referral code.
          </p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-6">
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Card Description Text</h2>
              <p className="text-sm text-gray-500 mb-4">
                This text appears on the Refer a Friend page below the title.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English
                  </label>
                  <textarea
                    value={settings.promoTextEn}
                    onChange={(e) => setSettings({ ...settings, promoTextEn: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={2}
                    placeholder="Share your code. When they place their first order, you both get 50% OFF!"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bangla (বাংলা)
                  </label>
                  <textarea
                    value={settings.promoTextBn}
                    onChange={(e) => setSettings({ ...settings, promoTextBn: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={2}
                    placeholder="আপনার কোড শেয়ার করুন। তারা প্রথম অর্ডার করলে, আপনি দুজনেই 50% ছাড় পাবেন!"
                  />
                </div>
              </div>
            </div>

            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Share Message Text</h2>
              <p className="text-sm text-gray-500 mb-4">
                This text is used when sharing via WhatsApp, Facebook, or copying the link.
                Use <code className="bg-gray-100 px-1 rounded">{"{code}"}</code> to insert the referral code.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    English
                  </label>
                  <textarea
                    value={settings.shareTextEn}
                    onChange={(e) => setSettings({ ...settings, shareTextEn: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Join Dealandme and get restaurant discounts! My referral code: {code}. Get 50% OFF on your first order!"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bangla (বাংলা)
                  </label>
                  <textarea
                    value={settings.shareTextBn}
                    onChange={(e) => setSettings({ ...settings, shareTextBn: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Dealandme এ জয়েন করুন এবং রেস্টুরেন্ট ডিসকাউন্ট পান! আমার রেফারেল কোড: {code}। প্রথম অর্ডারে 50% ছাড় পাবেন!"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Referral Points</h2>
              <p className="text-sm text-gray-500 mb-4">
                Points awarded to the referrer when someone uses their referral code.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points per successful referral
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.pointsPerReferral}
                  onChange={(e) => setSettings({ ...settings, pointsPerReferral: parseInt(e.target.value) || 0 })}
                  className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="10"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Points will be added to the referrer&apos;s account when a new user signs up with their code.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </button>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Tips:</h4>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>Keep the text concise and compelling</li>
              <li>Make sure to include realistic discount amounts</li>
              <li>The share text should include the referral code placeholder <code className="bg-blue-100 px-1 rounded">{"{code}"}</code></li>
              <li>Changes will be reflected immediately on the Refer a Friend page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
