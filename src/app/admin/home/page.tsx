"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

interface HomeCategory {
  id: string;
  key: string;
  labelEn: string;
  labelBn: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
}

interface Offer {
  id: string;
  offerText: string;
  isFeatured: boolean;
  featuredSortOrder: number | null;
  discountType: string | null;
  discountValue: number | null;
  photoUrl: string | null;
  restaurant: {
    id: string;
    name: string;
    area: string;
    cuisine: string | null;
  };
}

interface Restaurant {
  id: string;
  name: string;
  area: string;
  cuisine: string | null;
  isPopular: boolean;
  popularSortOrder: number | null;
  latitude: number | null;
  longitude: number | null;
  offer: {
    id: string;
    offerText: string;
  } | null;
}

const ICON_OPTIONS = [
  { key: "near_me", label: "Near Me", icon: "📍" },
  { key: "buffet", label: "Buffet", icon: "🍽️" },
  { key: "cafe", label: "Cafe", icon: "☕" },
  { key: "diler", label: "Diler", icon: "🍛" },
  { key: "cooking", label: "Cooking", icon: "👨‍🍳" },
  { key: "stoas", label: "Stoas", icon: "🏪" },
  { key: "fast_food", label: "Fast Food", icon: "🍔" },
  { key: "chinese", label: "Chinese", icon: "🥡" },
  { key: "indian", label: "Indian", icon: "🍛" },
  { key: "thai", label: "Thai", icon: "🍜" },
  { key: "dessert", label: "Dessert", icon: "🍰" },
  { key: "pizza", label: "Pizza", icon: "🍕" },
];

export default function AdminHomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"categories" | "featured" | "popular">("categories");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  
  const [newCategory, setNewCategory] = useState({
    key: "",
    labelEn: "",
    labelBn: "",
    iconKey: "buffet",
    sortOrder: 0,
  });
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.authenticated || data.user?.type !== "ADMIN") {
        router.push("/admin/login");
        return;
      }
      fetchData();
    }
    checkAuth();
  }, [router]);

  async function fetchData() {
    setLoading(true);
    try {
      const [catRes, offersRes, restRes] = await Promise.all([
        fetch("/api/admin/home-categories"),
        fetch("/api/admin/featured-offers"),
        fetch("/api/admin/popular-restaurants"),
      ]);

      if (catRes.ok) {
        const data = await catRes.json();
        setCategories(data.categories || []);
      }
      if (offersRes.ok) {
        const data = await offersRes.json();
        setOffers(data.offers || []);
      }
      if (restRes.ok) {
        const data = await restRes.json();
        setRestaurants(data.restaurants || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory() {
    if (!newCategory.key || !newCategory.labelEn || !newCategory.labelBn) {
      alert("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/home-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });
      if (res.ok) {
        setNewCategory({ key: "", labelEn: "", labelBn: "", iconKey: "buffet", sortOrder: 0 });
        setShowAddCategory(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add category");
      }
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateCategory(id: string, updates: Partial<HomeCategory>) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/home-categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error updating category:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/home-categories?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleFeatured(offerId: string, isFeatured: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/featured-offers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: offerId,
          isFeatured,
          featuredSortOrder: isFeatured ? offers.filter(o => o.isFeatured).length + 1 : null,
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error updating offer:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePopular(restaurantId: string, isPopular: boolean) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/popular-restaurants", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: restaurantId,
          isPopular,
          popularSortOrder: isPopular ? restaurants.filter(r => r.isPopular).length + 1 : null,
        }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Error updating restaurant:", error);
    } finally {
      setSaving(false);
    }
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
      <main className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Home Screen Management</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "categories"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Categories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab("featured")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "featured"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Featured Deals ({offers.filter(o => o.isFeatured).length})
          </button>
          <button
            onClick={() => setActiveTab("popular")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "popular"
                ? "bg-purple-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Popular Restaurants ({restaurants.filter(r => r.isPopular).length})
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Home Categories</h2>
              <button
                onClick={() => setShowAddCategory(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                + Add Category
              </button>
            </div>

            {showAddCategory && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-medium text-gray-700 mb-3">Add New Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Key (e.g., buffet)"
                    value={newCategory.key}
                    onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value.toLowerCase().replace(/\s/g, "_") })}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="English Label"
                    value={newCategory.labelEn}
                    onChange={(e) => setNewCategory({ ...newCategory, labelEn: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Bangla Label"
                    value={newCategory.labelBn}
                    onChange={(e) => setNewCategory({ ...newCategory, labelBn: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <select
                    value={newCategory.iconKey}
                    onChange={(e) => setNewCategory({ ...newCategory, iconKey: e.target.value })}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  >
                    {ICON_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>
                        {opt.icon} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleAddCategory}
                    disabled={saving}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setShowAddCategory(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No categories yet. Add your first category!</p>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">
                        {ICON_OPTIONS.find((o) => o.key === cat.iconKey)?.icon || "📁"}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800">{cat.labelEn}</p>
                        <p className="text-sm text-gray-500">{cat.labelBn}</p>
                      </div>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">{cat.key}</span>
                      {cat.isSystem && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">System</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={cat.isActive}
                          onChange={(e) => handleUpdateCategory(cat.id, { isActive: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600">Active</span>
                      </label>
                      <input
                        type="number"
                        value={cat.sortOrder}
                        onChange={(e) => handleUpdateCategory(cat.id, { sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-center"
                        title="Sort Order"
                      />
                      {!cat.isSystem && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Featured Deals Tab */}
        {activeTab === "featured" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Featured Deals (সেরা ডিল)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Select which offers appear in the &quot;Featured Deals&quot; carousel on the home screen.
            </p>

            <div className="space-y-2">
              {offers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active offers found.</p>
              ) : (
                offers.map((offer) => (
                  <div
                    key={offer.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      offer.isFeatured ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {offer.photoUrl ? (
                        <img
                          src={offer.photoUrl}
                          alt=""
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{offer.restaurant.name}</p>
                        <p className="text-sm text-gray-500">{offer.restaurant.area}</p>
                        <p className="text-sm text-purple-600">{offer.offerText}</p>
                        {offer.discountValue && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            {offer.discountType === "PERCENTAGE" ? `${offer.discountValue}% off` : `৳${offer.discountValue} off`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={offer.isFeatured}
                          onChange={(e) => handleToggleFeatured(offer.id, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Featured</span>
                      </label>
                      {offer.isFeatured && (
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                          #{offer.featuredSortOrder || "-"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Popular Restaurants Tab */}
        {activeTab === "popular" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Popular Restaurants (জনপ্রিয় রেস্টুরেন্ট)</h2>
            <p className="text-sm text-gray-500 mb-4">
              Select which restaurants appear in the &quot;Popular Restaurants&quot; section on the home screen.
            </p>

            <div className="space-y-2">
              {restaurants.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No active restaurants found.</p>
              ) : (
                restaurants.map((restaurant) => (
                  <div
                    key={restaurant.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      restaurant.isPopular ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-800">{restaurant.name}</p>
                      <p className="text-sm text-gray-500">{restaurant.area}</p>
                      {restaurant.offer && (
                        <p className="text-sm text-purple-600">{restaurant.offer.offerText}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={restaurant.isPopular}
                          onChange={(e) => handleTogglePopular(restaurant.id, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Popular</span>
                      </label>
                      {restaurant.isPopular && (
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                          #{restaurant.popularSortOrder || "-"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
