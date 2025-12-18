"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";

interface Area {
  id: string;
  nameEn: string;
  nameBn: string;
}

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
  updatedAt: string;
}

interface Restaurant {
  id: string;
  name: string;
  area: string;
  description: string | null;
  coverImage: string | null;
  coverImagePosition: string | null;
  username: string;
  isActive: boolean;
  offPeakBoost: boolean;
  commissionRate: number;
  trialEndDate: string | null;
  offer: Offer | null;
  createdAt: string;
}

export default function EditRestaurant() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [areas, setAreas] = useState<Area[]>([]);

    const [formData, setFormData] = useState({
      name: "",
      area: "",
      description: "",
      isActive: true,
      newPassword: "",
      coverImage: "",
      coverImagePosition: "center",
      commissionRate: 10,
      trialEndDate: "",
    });
    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImagePositionClick = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      setFormData((prev) => ({ ...prev, coverImagePosition: `${x}% ${y}%` }));
    };

  const [offerData, setOfferData] = useState({
    offerText: "",
    isActive: true,
  });

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

          fetchRestaurant();
        } catch {
          router.push("/admin/login");
        }
      };

      checkAuth();
    }, [router, id]);

  const fetchRestaurant = async () => {
    try {
      const res = await fetch(`/api/admin/restaurants/${id}`);
      if (res.ok) {
        const data = await res.json();
        setRestaurant(data.restaurant);
                setFormData({
                  name: data.restaurant.name,
                  area: data.restaurant.area,
                  description: data.restaurant.description || "",
                  isActive: data.restaurant.isActive,
                  newPassword: "",
                  coverImage: data.restaurant.coverImage || "",
                  coverImagePosition: data.restaurant.coverImagePosition || "center",
                  commissionRate: data.restaurant.commissionRate || 10,
                  trialEndDate: data.restaurant.trialEndDate ? data.restaurant.trialEndDate.split("T")[0] : "",
                });
        if (data.restaurant.offer) {
          setOfferData({
            offerText: data.restaurant.offer.offerText,
            isActive: data.restaurant.offer.isActive,
          });
        }
      } else {
        setError("Restaurant not found");
      }
    } catch {
      setError("Failed to fetch restaurant");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update restaurant");
        return;
      }

      setSuccess("Restaurant updated successfully!");
      setFormData({ ...formData, newPassword: "" });
      fetchRestaurant();
    } catch {
      setError("Failed to update restaurant");
    } finally {
      setSubmitting(false);
    }
  };

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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "restaurant-cover");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      setFormData((prev) => ({ ...prev, coverImage: data.url }));
      setSuccess("Image uploaded! Click 'Save Restaurant Details' to save.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/admin/restaurants/${id}/offer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(offerData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update offer");
        return;
      }

      setSuccess("Offer updated successfully!");
      fetchRestaurant();
    } catch {
      setError("Failed to update offer");
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

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Restaurant not found</p>
          <Link href="/admin/restaurants" className="text-purple-600 hover:text-purple-800">
            Back to Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Edit Restaurant: {restaurant.name}
        </h1>

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

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Restaurant Details</h3>
          
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
                                <p className="text-xs text-blue-600 mb-2">
                                  Click on the image to set the focal point (where the important content is)
                                </p>
                                <div 
                                  className="relative w-full h-40 rounded-lg border-2 border-blue-300 overflow-hidden cursor-crosshair"
                                  onClick={handleImagePositionClick}
                                >
                                  <img
                                    src={formData.coverImage}
                                    alt="Cover"
                                    className="w-full h-full object-cover"
                                    style={{ objectPosition: formData.coverImagePosition }}
                                  />
                                  <div 
                                    className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg"
                                    style={{ 
                                      left: formData.coverImagePosition.includes('%') 
                                        ? formData.coverImagePosition.split(' ')[0] 
                                        : '50%',
                                      top: formData.coverImagePosition.includes('%') 
                                        ? formData.coverImagePosition.split(' ')[1] || '50%'
                                        : '50%'
                                    }}
                                  />
                                </div>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-xs text-gray-500">
                                    Position: {formData.coverImagePosition}
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setFormData({ ...formData, coverImagePosition: "center" })}
                                      className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                      Reset to Center
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setFormData({ ...formData, coverImage: "", coverImagePosition: "center" })}
                                      className="text-xs text-red-600 hover:text-red-800"
                                    >
                                      Remove Image
                                    </button>
                                  </div>
                                </div>
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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Restaurant is active
              </label>
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
                    No commission charged until this date. Leave empty for no trial.
                  </p>
                  {formData.trialEndDate && new Date(formData.trialEndDate) > new Date() && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      Trial active until {new Date(formData.trialEndDate).toLocaleDateString()}
                    </p>
                  )}
                  {formData.trialEndDate && new Date(formData.trialEndDate) <= new Date() && (
                    <p className="text-xs text-orange-600 mt-1 font-medium">
                      Trial period has ended
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const threeMonthsLater = new Date();
                    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
                    setFormData({ ...formData, trialEndDate: threeMonthsLater.toISOString().split("T")[0] });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Set 3-month trial from today
                </button>
              </div>
            </div>

            <hr className="border-gray-200" />

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Reset Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Leave empty to keep current password"
              />
              <p className="text-sm text-gray-500 mt-1">
                Username: <span className="font-mono">{restaurant.username}</span>
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Saving..." : "Save Restaurant Details"}
            </button>
          </div>
        </form>

        {/* Structured Offer Display (Read-only) */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Offer Details</h3>
          
          {restaurant.offer ? (
            <div className="space-y-4">
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  restaurant.offer.isActive 
                    ? "bg-green-100 text-green-700" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {restaurant.offer.isActive ? "Active" : "Paused"}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  restaurant.offPeakBoost 
                    ? "bg-orange-100 text-orange-700" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  Off-peak Boost: {restaurant.offPeakBoost ? "ON" : "OFF"}
                </span>
              </div>

              {/* Title */}
              {restaurant.offer.title && (
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="text-lg font-semibold text-gray-900">{restaurant.offer.title}</p>
                </div>
              )}

              {/* Discount Summary */}
              <div>
                <p className="text-sm text-gray-500">Discount</p>
                <p className="text-lg font-semibold text-purple-600">
                  {restaurant.offer.discountType === "PERCENTAGE" && restaurant.offer.discountValue
                    ? `${restaurant.offer.discountValue}% off${restaurant.offer.maxDiscountAmount ? ` (Up to ৳${restaurant.offer.maxDiscountAmount})` : ""}`
                    : restaurant.offer.discountType === "FLAT" && restaurant.offer.discountValue
                    ? `৳${restaurant.offer.discountValue} off`
                    : restaurant.offer.offerText || "No discount set"}
                </p>
              </div>

              {/* Description */}
              {restaurant.offer.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{restaurant.offer.description}</p>
                </div>
              )}

              {/* Terms */}
              {restaurant.offer.terms && (
                <div>
                  <p className="text-sm text-gray-500">Terms & Conditions</p>
                  <p className="text-gray-700">{restaurant.offer.terms}</p>
                </div>
              )}

              {/* Photo */}
              {restaurant.offer.photoUrl && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Photo</p>
                  <img 
                    src={restaurant.offer.photoUrl} 
                    alt="Offer" 
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* Legacy Offer Text (if no structured fields) */}
              {!restaurant.offer.title && !restaurant.offer.discountType && restaurant.offer.offerText && (
                <div>
                  <p className="text-sm text-gray-500">Offer Text (Legacy)</p>
                  <p className="text-gray-700">{restaurant.offer.offerText}</p>
                </div>
              )}

              {/* Last Updated */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Last updated: {new Date(restaurant.offer.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No active offer</p>
              <p className="text-sm text-gray-400 mt-1">Create an offer using the form below</p>
            </div>
          )}
        </div>

        {/* Offer Edit Form (for quick updates) */}
        <form onSubmit={handleOfferSubmit} className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Offer Update</h3>
          <p className="text-sm text-gray-500 mb-4">
            For full offer editing with structured fields, the restaurant owner can use their dashboard.
          </p>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="offerText" className="block text-sm font-medium text-gray-700 mb-1">
                Offer Text *
              </label>
              <textarea
                id="offerText"
                rows={2}
                required
                value={offerData.offerText}
                onChange={(e) => setOfferData({ ...offerData, offerText: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., 20% off on all items"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="offerIsActive"
                checked={offerData.isActive}
                onChange={(e) => setOfferData({ ...offerData, isActive: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="offerIsActive" className="text-sm font-medium text-gray-700">
                Offer is active
              </label>
            </div>

            {!offerData.isActive && (
              <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                When the offer is inactive, customers will not see this restaurant or be able to generate coupons.
              </p>
            )}
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Saving..." : restaurant.offer ? "Update Offer" : "Create Offer"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
