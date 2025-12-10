"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

interface Area {
  id: string;
  nameEn: string;
  nameBn: string;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminAreasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newArea, setNewArea] = useState({
    nameEn: "",
    nameBn: "",
    sortOrder: 0,
  });
  const [editArea, setEditArea] = useState({
    nameEn: "",
    nameBn: "",
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
      fetchAreas();
    }
    checkAuth();
  }, [router]);

  async function fetchAreas() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/areas");
      if (res.ok) {
        const data = await res.json();
        setAreas(data.areas || []);
      }
    } catch (error) {
      console.error("Error fetching areas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddArea() {
    if (!newArea.nameEn || !newArea.nameBn) {
      alert("Please fill both English and Bangla names");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newArea),
      });
      if (res.ok) {
        setNewArea({ nameEn: "", nameBn: "", sortOrder: 0 });
        setShowAddForm(false);
        fetchAreas();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add area");
      }
    } catch (error) {
      console.error("Error adding area:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateArea(id: string) {
    if (!editArea.nameEn || !editArea.nameBn) {
      alert("Please fill both English and Bangla names");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/areas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editArea }),
      });
      if (res.ok) {
        setEditingId(null);
        fetchAreas();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update area");
      }
    } catch (error) {
      console.error("Error updating area:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/areas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (res.ok) {
        fetchAreas();
      }
    } catch (error) {
      console.error("Error updating area:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteArea(id: string) {
    if (!confirm("Are you sure you want to delete this area?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/areas?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchAreas();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete area");
      }
    } catch (error) {
      console.error("Error deleting area:", error);
    } finally {
      setSaving(false);
    }
  }

  function startEditing(area: Area) {
    setEditingId(area.id);
    setEditArea({
      nameEn: area.nameEn,
      nameBn: area.nameBn,
      sortOrder: area.sortOrder,
    });
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
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Area Management</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage areas for restaurant location filtering
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Area
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Area</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  English Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Dhanmondi"
                  value={newArea.nameEn}
                  onChange={(e) => setNewArea({ ...newArea, nameEn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bangla Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., ধানমন্ডি"
                  value={newArea.nameBn}
                  onChange={(e) => setNewArea({ ...newArea, nameBn: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={newArea.sortOrder}
                  onChange={(e) => setNewArea({ ...newArea, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddArea}
                disabled={saving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save Area"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewArea({ nameEn: "", nameBn: "", sortOrder: 0 });
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
              All Areas ({areas.length})
            </h2>
          </div>

          {areas.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-gray-500">No areas yet. Add your first area!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {areas.map((area) => (
                <div key={area.id} className="px-6 py-4">
                  {editingId === area.id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            English Name
                          </label>
                          <input
                            type="text"
                            value={editArea.nameEn}
                            onChange={(e) => setEditArea({ ...editArea, nameEn: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bangla Name
                          </label>
                          <input
                            type="text"
                            value={editArea.nameBn}
                            onChange={(e) => setEditArea({ ...editArea, nameBn: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sort Order
                          </label>
                          <input
                            type="number"
                            value={editArea.sortOrder}
                            onChange={(e) => setEditArea({ ...editArea, sortOrder: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateArea(area.id)}
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
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{area.nameEn}</p>
                          <p className="text-sm text-gray-500">{area.nameBn}</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          Order: {area.sortOrder}
                        </span>
                        {!area.isActive && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={area.isActive}
                            onChange={(e) => handleToggleActive(area.id, e.target.checked)}
                            className="rounded text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-600">Active</span>
                        </label>
                        <button
                          onClick={() => startEditing(area)}
                          className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteArea(area.id)}
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
          <h3 className="font-medium text-blue-800 mb-2">How Areas Work</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Areas are used to filter restaurants on the Search page</li>
            <li>• Only active areas will appear in the customer filter</li>
            <li>• Sort order determines the display order (lower numbers appear first)</li>
            <li>• When creating a new restaurant, select an area from the dropdown</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
