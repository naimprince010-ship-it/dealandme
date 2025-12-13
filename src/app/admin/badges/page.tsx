"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

interface Badge {
  id: string;
  key: string;
  nameEn: string;
  nameBn: string;
  description: string | null;
  icon: string;
  criteriaType: string;
  threshold: number;
  sortOrder: number;
  isActive: boolean;
}

const CRITERIA_TYPES = [
  { value: "COUPONS_USED", label: "Coupons Used", labelBn: "কুপন ব্যবহার" },
  { value: "COUPONS_GENERATED", label: "Coupons Generated", labelBn: "কুপন তৈরি" },
  { value: "RESTAURANTS_VISITED", label: "Restaurants Visited", labelBn: "রেস্টুরেন্ট ভিজিট" },
  { value: "REFERRALS", label: "Referrals", labelBn: "রেফারেল" },
];

const BADGE_ICONS = ["🏅", "🎫", "🎟️", "🏆", "👑", "🍽️", "🌟", "⭐", "🗺️", "🤝", "💫", "🎖️", "🥇", "🥈", "🥉", "💎", "🔥", "❤️", "👍", "🛡️"];

export default function AdminBadgesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newBadge, setNewBadge] = useState({
    key: "",
    nameEn: "",
    nameBn: "",
    description: "",
    icon: "🏅",
    criteriaType: "COUPONS_USED",
    threshold: 1,
    sortOrder: 0,
  });
  const [editBadge, setEditBadge] = useState({
    key: "",
    nameEn: "",
    nameBn: "",
    description: "",
    icon: "🏅",
    criteriaType: "COUPONS_USED",
    threshold: 1,
    sortOrder: 0,
  });

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.authenticated || data.user?.type !== "ADMIN") {
        router.push("/admin/login");
        return;
      }
      fetchBadges();
    }
    checkAuth();
  }, [router]);

  async function fetchBadges() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/badges");
      if (res.ok) {
        const data = await res.json();
        setBadges(data.badges || []);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBadge() {
    if (!newBadge.key || !newBadge.nameEn || !newBadge.nameBn) {
      alert("Please fill key and both names");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBadge),
      });
      if (res.ok) {
        setNewBadge({
          key: "",
          nameEn: "",
          nameBn: "",
          description: "",
          icon: "🏅",
          criteriaType: "COUPONS_USED",
          threshold: 1,
          sortOrder: 0,
        });
        setShowAddForm(false);
        fetchBadges();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add badge");
      }
    } catch (error) {
      console.error("Error adding badge:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateBadge(id: string) {
    if (!editBadge.nameEn || !editBadge.nameBn) {
      alert("Please fill both names");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/badges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editBadge }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchBadges();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update badge");
      }
    } catch (error) {
      console.error("Error updating badge:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/badges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (res.ok) {
        fetchBadges();
      }
    } catch (error) {
      console.error("Error updating badge:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteBadge(id: string) {
    if (!confirm("Are you sure you want to delete this badge?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/badges?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchBadges();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete badge");
      }
    } catch (error) {
      console.error("Error deleting badge:", error);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(badge: Badge) {
    setEditingId(badge.id);
    setEditBadge({
      key: badge.key,
      nameEn: badge.nameEn,
      nameBn: badge.nameBn,
      description: badge.description || "",
      icon: badge.icon,
      criteriaType: badge.criteriaType,
      threshold: badge.threshold,
      sortOrder: badge.sortOrder,
    });
  }

  function getCriteriaLabel(type: string) {
    return CRITERIA_TYPES.find(c => c.value === type)?.label || type;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Badge Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage badges for customer gamification
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Badge
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Badge</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key (unique) *
                </label>
                <input
                  type="text"
                  placeholder="e.g., first_coupon"
                  value={newBadge.key}
                  onChange={(e) => setNewBadge({ ...newBadge, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  English Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., First Coupon"
                  value={newBadge.nameEn}
                  onChange={(e) => setNewBadge({ ...newBadge, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bangla Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., প্রথম কুপন"
                  value={newBadge.nameBn}
                  onChange={(e) => setNewBadge({ ...newBadge, nameBn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <select
                  value={newBadge.icon}
                  onChange={(e) => setNewBadge({ ...newBadge, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {BADGE_ICONS.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Criteria Type *
                </label>
                <select
                  value={newBadge.criteriaType}
                  onChange={(e) => setNewBadge({ ...newBadge, criteriaType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {CRITERIA_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Threshold *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newBadge.threshold}
                  onChange={(e) => setNewBadge({ ...newBadge, threshold: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={newBadge.sortOrder}
                  onChange={(e) => setNewBadge({ ...newBadge, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  type="text"
                  placeholder="Badge description"
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({ ...newBadge, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddBadge}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Badge"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewBadge({
                    key: "",
                    nameEn: "",
                    nameBn: "",
                    description: "",
                    icon: "🏅",
                    criteriaType: "COUPONS_USED",
                    threshold: 1,
                    sortOrder: 0,
                  });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              All Badges ({badges.length})
            </h2>
          </div>

          {badges.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🏅</span>
              </div>
              <p className="text-gray-500">No badges yet. Add your first badge!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {badges.map((badge) => (
                <div key={badge.id} className="px-6 py-4">
                  {editingId === badge.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Key
                          </label>
                          <input
                            type="text"
                            value={editBadge.key}
                            onChange={(e) => setEditBadge({ ...editBadge, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            English Name
                          </label>
                          <input
                            type="text"
                            value={editBadge.nameEn}
                            onChange={(e) => setEditBadge({ ...editBadge, nameEn: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bangla Name
                          </label>
                          <input
                            type="text"
                            value={editBadge.nameBn}
                            onChange={(e) => setEditBadge({ ...editBadge, nameBn: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Icon
                          </label>
                          <select
                            value={editBadge.icon}
                            onChange={(e) => setEditBadge({ ...editBadge, icon: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            {BADGE_ICONS.map(icon => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Criteria Type
                          </label>
                          <select
                            value={editBadge.criteriaType}
                            onChange={(e) => setEditBadge({ ...editBadge, criteriaType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            {CRITERIA_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Threshold
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={editBadge.threshold}
                            onChange={(e) => setEditBadge({ ...editBadge, threshold: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sort Order
                          </label>
                          <input
                            type="number"
                            value={editBadge.sortOrder}
                            onChange={(e) => setEditBadge({ ...editBadge, sortOrder: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={editBadge.description}
                            onChange={(e) => setEditBadge({ ...editBadge, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateBadge(badge.id)}
                          disabled={saving}
                          className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-2xl">{badge.icon}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{badge.nameEn}</p>
                          <p className="text-sm text-gray-500">{badge.nameBn}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                            {getCriteriaLabel(badge.criteriaType)} &ge; {badge.threshold}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Order: {badge.sortOrder}
                          </span>
                          {!badge.isActive && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={badge.isActive}
                            onChange={(e) => handleToggleActive(badge.id, e.target.checked)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600">Active</span>
                        </label>
                        <button
                          onClick={() => startEditing(badge)}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBadge(badge.id)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-800 mb-2">How Badges Work</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Badges are automatically unlocked when customers reach the threshold</li>
            <li>• Criteria types: Coupons Used, Coupons Generated, Restaurants Visited, Referrals</li>
            <li>• Only active badges will appear on customer profiles</li>
            <li>• Sort order determines the display order (lower numbers appear first)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
