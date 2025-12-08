"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RestaurantNav from "@/components/RestaurantNav";
import { useLanguage } from "@/lib/LanguageContext";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface ScheduledOffer {
  id: string;
  offerText: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function RestaurantSettings() {
  const router = useRouter();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Photos state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [newPhotoCaption, setNewPhotoCaption] = useState("");

  // Menu state
  const [menuUrl, setMenuUrl] = useState("");
  const [editingMenu, setEditingMenu] = useState(false);
  const [newMenuUrl, setNewMenuUrl] = useState("");

  // Scheduled offers state
  const [scheduledOffers, setScheduledOffers] = useState<ScheduledOffer[]>([]);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [newOfferText, setNewOfferText] = useState("");
  const [newOfferStart, setNewOfferStart] = useState("");
  const [newOfferEnd, setNewOfferEnd] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "RESTAURANT") {
          router.push("/restaurant/login");
          return;
        }

        // Fetch photos, menu, and scheduled offers in parallel
        const [photosRes, menuRes, offersRes] = await Promise.all([
          fetch("/api/restaurant/photos"),
          fetch("/api/restaurant/menu"),
          fetch("/api/restaurant/scheduled-offers"),
        ]);

        if (photosRes.ok) {
          const photosData = await photosRes.json();
          setPhotos(photosData.photos || []);
        }

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuUrl(menuData.menuUrl || "");
          setNewMenuUrl(menuData.menuUrl || "");
        }

        if (offersRes.ok) {
          const offersData = await offersRes.json();
          setScheduledOffers(offersData.scheduledOffers || []);
        }
      } catch {
        router.push("/restaurant/login");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Photo handlers
  const addPhoto = async () => {
    if (!newPhotoUrl.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/restaurant/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newPhotoUrl,
          caption: newPhotoCaption || null,
          isPrimary: photos.length === 0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos([...photos, data.photo]);
        setNewPhotoUrl("");
        setNewPhotoCaption("");
      }
    } catch (error) {
      console.error("Error adding photo:", error);
    } finally {
      setSaving(false);
    }
  };

  const deletePhoto = async (photoId: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/restaurant/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok) {
        setPhotos(photos.filter((p) => p.id !== photoId));
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
    } finally {
      setSaving(false);
    }
  };

  const setPrimaryPhoto = async (photoId: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/restaurant/photos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, isPrimary: true }),
      });
      if (res.ok) {
        setPhotos(
          photos.map((p) => ({
            ...p,
            isPrimary: p.id === photoId,
          }))
        );
      }
    } catch (error) {
      console.error("Error setting primary photo:", error);
    } finally {
      setSaving(false);
    }
  };

  // Menu handlers
  const saveMenu = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/restaurant/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menuUrl: newMenuUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setMenuUrl(data.menuUrl || "");
        setEditingMenu(false);
      }
    } catch (error) {
      console.error("Error saving menu:", error);
    } finally {
      setSaving(false);
    }
  };

  // Scheduled offer handlers
  const addScheduledOffer = async () => {
    if (!newOfferText.trim() || !newOfferStart || !newOfferEnd) return;
    setSaving(true);
    try {
      const res = await fetch("/api/restaurant/scheduled-offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerText: newOfferText,
          startTime: newOfferStart,
          endTime: newOfferEnd,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setScheduledOffers([...scheduledOffers, data.scheduledOffer]);
        setNewOfferText("");
        setNewOfferStart("");
        setNewOfferEnd("");
        setShowAddOffer(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add scheduled offer");
      }
    } catch (error) {
      console.error("Error adding scheduled offer:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteScheduledOffer = async (offerId: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/restaurant/scheduled-offers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId }),
      });
      if (res.ok) {
        setScheduledOffers(scheduledOffers.filter((o) => o.id !== offerId));
      }
    } catch (error) {
      console.error("Error deleting scheduled offer:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleScheduledOffer = async (offerId: string, isActive: boolean) => {
    setSaving(true);
    try {
      const res = await fetch("/api/restaurant/scheduled-offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, isActive: !isActive }),
      });
      if (res.ok) {
        setScheduledOffers(
          scheduledOffers.map((o) =>
            o.id === offerId ? { ...o, isActive: !isActive } : o
          )
        );
      }
    } catch (error) {
      console.error("Error toggling scheduled offer:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(language === "bn" ? "bn-BD" : "en-US", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RestaurantNav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {language === "bn" ? "রেস্টুরেন্ট সেটিংস" : "Restaurant Settings"}
        </h1>

        {/* Photos Gallery Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📷</span>
            {language === "bn" ? "ফটো গ্যালারি" : "Photo Gallery"}
          </h2>

          {/* Existing Photos */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.caption || "Restaurant photo"}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {photo.isPrimary && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      {language === "bn" ? "প্রাইমারি" : "Primary"}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    {!photo.isPrimary && (
                      <button
                        onClick={() => setPrimaryPhoto(photo.id)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs"
                        disabled={saving}
                      >
                        {language === "bn" ? "প্রাইমারি" : "Set Primary"}
                      </button>
                    )}
                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                      disabled={saving}
                    >
                      {language === "bn" ? "মুছুন" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Photo Form */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {language === "bn" ? "নতুন ফটো যোগ করুন" : "Add New Photo"}
            </h3>
            <div className="space-y-2">
              <input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder={language === "bn" ? "ফটো URL দিন..." : "Enter photo URL..."}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                value={newPhotoCaption}
                onChange={(e) => setNewPhotoCaption(e.target.value)}
                placeholder={language === "bn" ? "ক্যাপশন (ঐচ্ছিক)" : "Caption (optional)"}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={addPhoto}
                disabled={saving || !newPhotoUrl.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "..." : language === "bn" ? "ফটো যোগ করুন" : "Add Photo"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {language === "bn"
                ? "টিপ: Google Drive, Imgur, বা অন্য কোনো ইমেজ হোস্টিং সার্ভিস থেকে URL দিন"
                : "Tip: Use URLs from Google Drive, Imgur, or any image hosting service"}
            </p>
          </div>
        </div>

        {/* Menu Upload Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>📋</span>
            {language === "bn" ? "মেনু" : "Menu"}
          </h2>

          {editingMenu ? (
            <div className="space-y-3">
              <input
                type="url"
                value={newMenuUrl}
                onChange={(e) => setNewMenuUrl(e.target.value)}
                placeholder={language === "bn" ? "মেনু URL দিন..." : "Enter menu URL..."}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveMenu}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "..." : language === "bn" ? "সেভ করুন" : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingMenu(false);
                    setNewMenuUrl(menuUrl);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {language === "bn" ? "বাতিল" : "Cancel"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {menuUrl ? (
                <div className="flex items-center justify-between">
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-2"
                  >
                    <span>📄</span>
                    {language === "bn" ? "মেনু দেখুন" : "View Menu"}
                  </a>
                  <button
                    onClick={() => setEditingMenu(true)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {language === "bn" ? "এডিট" : "Edit"}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-2">
                    {language === "bn" ? "কোনো মেনু যোগ করা হয়নি" : "No menu added yet"}
                  </p>
                  <button
                    onClick={() => setEditingMenu(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {language === "bn" ? "মেনু যোগ করুন" : "Add Menu"}
                  </button>
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-3">
            {language === "bn"
              ? "টিপ: Google Drive বা Dropbox এ মেনু PDF আপলোড করে শেয়ার লিংক দিন"
              : "Tip: Upload your menu PDF to Google Drive or Dropbox and share the link"}
          </p>
        </div>

        {/* Scheduled Offers Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span>⏰</span>
              {language === "bn" ? "শিডিউল অফার" : "Scheduled Offers"}
            </h2>
            <button
              onClick={() => setShowAddOffer(!showAddOffer)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
            >
              {showAddOffer
                ? language === "bn"
                  ? "বাতিল"
                  : "Cancel"
                : language === "bn"
                ? "নতুন শিডিউল"
                : "New Schedule"}
            </button>
          </div>

          {/* Add Scheduled Offer Form */}
          {showAddOffer && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
              <input
                type="text"
                value={newOfferText}
                onChange={(e) => setNewOfferText(e.target.value)}
                placeholder={language === "bn" ? "অফার টেক্সট..." : "Offer text..."}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {language === "bn" ? "শুরু" : "Start Time"}
                  </label>
                  <input
                    type="datetime-local"
                    value={newOfferStart}
                    onChange={(e) => setNewOfferStart(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    {language === "bn" ? "শেষ" : "End Time"}
                  </label>
                  <input
                    type="datetime-local"
                    value={newOfferEnd}
                    onChange={(e) => setNewOfferEnd(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                onClick={addScheduledOffer}
                disabled={saving || !newOfferText.trim() || !newOfferStart || !newOfferEnd}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? "..." : language === "bn" ? "শিডিউল করুন" : "Schedule Offer"}
              </button>
            </div>
          )}

          {/* Scheduled Offers List */}
          {scheduledOffers.length > 0 ? (
            <div className="space-y-3">
              {scheduledOffers.map((offer) => {
                const now = new Date();
                const start = new Date(offer.startTime);
                const end = new Date(offer.endTime);
                const isLive = offer.isActive && start <= now && end >= now;
                const isPast = end < now;

                return (
                  <div
                    key={offer.id}
                    className={`p-4 rounded-lg border ${
                      isLive
                        ? "border-green-300 bg-green-50"
                        : isPast
                        ? "border-gray-200 bg-gray-50 opacity-60"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {isLive && (
                            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded animate-pulse">
                              LIVE
                            </span>
                          )}
                          {isPast && (
                            <span className="bg-gray-400 text-white text-xs px-2 py-0.5 rounded">
                              {language === "bn" ? "শেষ" : "Ended"}
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              offer.isActive
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {offer.isActive
                              ? language === "bn"
                                ? "সক্রিয়"
                                : "Active"
                              : language === "bn"
                              ? "বিরতি"
                              : "Paused"}
                          </span>
                        </div>
                        <p className="font-medium text-gray-800">{offer.offerText}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDateTime(offer.startTime)} - {formatDateTime(offer.endTime)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!isPast && (
                          <button
                            onClick={() => toggleScheduledOffer(offer.id, offer.isActive)}
                            disabled={saving}
                            className={`px-3 py-1 rounded text-xs ${
                              offer.isActive
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {offer.isActive
                              ? language === "bn"
                                ? "বিরতি"
                                : "Pause"
                              : language === "bn"
                              ? "চালু"
                              : "Resume"}
                          </button>
                        )}
                        <button
                          onClick={() => deleteScheduledOffer(offer.id)}
                          disabled={saving}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                        >
                          {language === "bn" ? "মুছুন" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              {language === "bn"
                ? "কোনো শিডিউল অফার নেই। নতুন শিডিউল করুন!"
                : "No scheduled offers. Create one!"}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
