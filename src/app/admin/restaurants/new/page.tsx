"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

interface Area {
  id: string;
  nameEn: string;
  nameBn: string;
}

export default function NewRestaurant() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);

  // Calculate default trial end date (3 months from now)
  const getDefaultTrialEndDate = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    name: "",
    area: "",
    description: "",
    username: "",
    password: "",
    coverImage: "",
    commissionRate: 10,
    trialEndDate: getDefaultTrialEndDate(),
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.authenticated || data.user?.type !== "ADMIN") {
          router.push("/admin/login");
          return;
        }
        
        const areasRes = await fetch("/api/admin/areas");
        if (areasRes.ok) {
          const areasData = await areasRes.json();
          setAreas(areasData.areas || []);
        }
        
        setLoading(false);
      } catch {
        router.push("/admin/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setError("");

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("type", "restaurant-cover");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setFormData((prev) => ({ ...prev, coverImage: data.url }));
      setSuccess("Image uploaded!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create restaurant");
        return;
      }

      setSuccess("Restaurant created successfully!");
      setTimeout(() => {
        router.push("/admin/restaurants");
      }, 1500);
    } catch {
      setError("Failed to create restaurant");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Restaurant</h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name *
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., Spice Garden"
              />
            </div>

                        <div>
                          <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                            Area *
                          </label>
                          <select
                            id="area"
                            required
                            value={formData.area}
                            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">Select an area</option>
                            {areas.map((area) => (
                              <option key={area.id} value={area.nameEn}>
                                {area.nameEn} ({area.nameBn})
                              </option>
                            ))}
                          </select>
                          {areas.length === 0 && (
                            <p className="text-sm text-amber-600 mt-1">
                              No areas found. <Link href="/admin/areas" className="underline">Add areas first</Link>
                            </p>
                          )}
                        </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Brief description of the restaurant..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image
              </label>
              <p className="text-xs text-gray-500 mb-2">
                This image will be displayed on the restaurant detail page (customer app)
              </p>
              
              {formData.coverImage && (
                <div className="mb-3">
                  <img
                    src={formData.coverImage}
                    alt="Cover"
                    className="w-full h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: "" })}
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Remove Image
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  <div className={`w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors ${uploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}>
                    {uploadingImage ? (
                      <span className="text-gray-500">Uploading...</span>
                    ) : (
                      <span className="text-gray-600">
                        {formData.coverImage ? "Change Image" : "Click to upload image"}
                      </span>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Commission & Trial Settings */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">Commission & Trial Settings</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Rate (৳ per coupon)
                  </label>
                  <input
                    type="number"
                    id="commissionRate"
                    min="0"
                    step="1"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Amount charged per redeemed coupon (default: ৳10)
                  </p>
                </div>

                <div>
                  <label htmlFor="trialEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Trial Period End Date
                  </label>
                  <input
                    type="date"
                    id="trialEndDate"
                    value={formData.trialEndDate}
                    onChange={(e) => setFormData({ ...formData, trialEndDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    No commission charged until this date. Default: 3 months from today.
                  </p>
                  {formData.trialEndDate && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      Trial active until {new Date(formData.trialEndDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, trialEndDate: getDefaultTrialEndDate() })}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Reset to 3 months
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, trialEndDate: "" })}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    No trial (charge immediately)
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Login Username *
              </label>
              <input
                type="text"
                id="username"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, "") })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., spicegarden"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will be used by the restaurant to log in
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Login Password *
              </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter a secure password"
              />
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Creating..." : "Create Restaurant"}
            </button>
            <Link
              href="/admin/restaurants"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
