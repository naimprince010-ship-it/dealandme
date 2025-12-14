"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SMSProvider {
  id: string;
  name: string;
  description: string;
  configured: boolean;
}

interface SMSSettings {
  currentProvider: string;
  providers: SMSProvider[];
}

export default function SMSSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SMSSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/sms-settings");
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

  const handleProviderChange = async (providerId: string) => {
    if (!settings) return;
    
    const provider = settings.providers.find(p => p.id === providerId);
    if (!provider?.configured) {
      setMessage({ 
        type: "error", 
        text: `${provider?.name} is not configured. Please add the required environment variables in Vercel.` 
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/sms-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });

      const data = await res.json();

      if (res.ok) {
        setSettings({ ...settings, currentProvider: providerId });
        setMessage({ type: "success", text: data.message });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update" });
      }
    } catch (error) {
      console.error("Error updating provider:", error);
      setMessage({ type: "error", text: "Failed to update provider" });
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">SMS Provider Settings</h1>
          <p className="text-gray-600 mb-6">Select which SMS provider to use for sending OTP messages</p>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            {settings?.providers.map((provider) => (
              <div
                key={provider.id}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  settings.currentProvider === provider.id
                    ? "border-green-500 bg-green-50"
                    : provider.configured
                    ? "border-gray-200 hover:border-gray-300"
                    : "border-gray-200 opacity-60"
                }`}
                onClick={() => handleProviderChange(provider.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-800">{provider.name}</h3>
                      {settings.currentProvider === provider.id && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                          Active
                        </span>
                      )}
                      {!provider.configured && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Not Configured
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{provider.description}</p>
                    
                    {provider.id === "ssl" && (
                      <div className="mt-3 text-sm text-gray-500">
                        <p className="font-medium">Required env vars:</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">SSLW_API_TOKEN, SSLW_SID</code>
                      </div>
                    )}
                    
                    {provider.id === "twilio" && (
                      <div className="mt-3 text-sm text-gray-500">
                        <p className="font-medium">Required env vars:</p>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER</code>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      settings.currentProvider === provider.id
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}>
                      {settings.currentProvider === provider.id && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {saving && (
            <div className="mt-6 flex items-center justify-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
              Saving...
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">How to configure providers:</h4>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Go to your Vercel project settings</li>
              <li>Navigate to Environment Variables</li>
              <li>Add the required environment variables for your chosen provider</li>
              <li>Redeploy your application</li>
              <li>Come back here and select the provider</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
