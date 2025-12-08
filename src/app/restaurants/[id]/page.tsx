"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Head from "next/head";
import CustomerNav from "@/components/CustomerNav";
import CouponUsageGuide from "@/components/CouponUsageGuide";
import { useLanguage } from "@/lib/LanguageContext";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
}

interface Restaurant {
  id: string;
  name: string;
  area: string;
  cuisine: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  menuUrl: string | null;
  avgRating: number;
  totalReviews: number;
  offer: {
    id: string;
    offerText: string;
    isActive: boolean;
  } | null;
  photos: Photo[];
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userPhone: string;
}

interface Coupon {
  id: string;
  code: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  restaurant: {
    name: string;
    area: string;
  };
  offer: {
    offerText: string;
  };
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { language, t } = useLanguage();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  
  // Photo gallery state
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Check auth first
        const authRes = await fetch("/api/auth/me");
        const authData = await authRes.json();

        if (!authData.authenticated || authData.user?.type !== "CUSTOMER") {
          router.push(`/login?redirect=/restaurants/${id}`);
          return;
        }

        // Fetch restaurant details and reviews in parallel
        const [restaurantRes, reviewsRes] = await Promise.all([
          fetch(`/api/restaurants/${id}`),
          fetch(`/api/reviews?restaurantId=${id}`),
        ]);

        const restaurantData = await restaurantRes.json();

        if (!restaurantRes.ok) {
          throw new Error(restaurantData.error || "Failed to fetch restaurant");
        }

        setRestaurant(restaurantData.restaurant);

        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
          
          // Check if user has already reviewed
          const userPhone = authData.user?.phone?.slice(-4) || "";
          const existingReview = reviewsData.reviews?.find(
            (r: Review) => r.userPhone?.endsWith(userPhone)
          );
          if (existingReview) {
            setUserReview(existingReview);
            setUserRating(existingReview.rating);
            setUserComment(existingReview.comment || "");
          }
        }

        // Check if user can review (has redeemed a coupon)
        const couponsRes = await fetch("/api/coupons/my-coupons");
        if (couponsRes.ok) {
          const couponsData = await couponsRes.json();
          const hasRedeemed = couponsData.coupons?.some(
            (c: { restaurantId: string; status: string }) => 
              c.restaurantId === id && c.status === "USED"
          );
          setCanReview(hasRedeemed);
        }

        // Record visit to this restaurant (fire and forget)
        fetch("/api/visit-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId: id }),
        }).catch(() => {
          // Silently ignore errors for visit tracking
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, router]);

  const handleGetCoupon = async () => {
    setGenerating(true);
    setCouponMessage("");
    setError("");

    try {
      const res = await fetch("/api/coupons/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ restaurantId: id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate coupon");
      }

      setCoupon(data.coupon);
      if (data.isExisting) {
        setCouponMessage("You already have an active coupon for this restaurant");
      } else {
        setCouponMessage("Coupon generated successfully!");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate coupon");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: id,
          rating: userRating,
          comment: userComment || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Refresh reviews
        const reviewsRes = await fetch(`/api/reviews?restaurantId=${id}`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
        }
        // Update restaurant rating
        if (restaurant) {
          setRestaurant({
            ...restaurant,
            avgRating: data.avgRating,
            totalReviews: data.totalReviews,
          });
        }
        setShowReviewForm(false);
        setUserReview(data.review);
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `Expires in ${hours}h ${minutes}m`;
    }
    return `Expires in ${minutes}m`;
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onSelect && onSelect(star)}
            className={`text-xl ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
            disabled={!interactive}
          >
            {star <= rating ? "⭐" : "☆"}
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link href="/restaurants" className="text-orange-500 hover:underline">
            Back to restaurants
          </Link>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Restaurant not found</p>
          <Link href="/restaurants" className="text-orange-500 hover:underline">
            Back to restaurants
          </Link>
        </div>
      </div>
    );
  }

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: restaurant.area,
      addressCountry: "BD",
    },
    servesCuisine: restaurant.cuisine || undefined,
    aggregateRating: restaurant.totalReviews > 0 ? {
      "@type": "AggregateRating",
      ratingValue: restaurant.avgRating,
      reviewCount: restaurant.totalReviews,
    } : undefined,
    image: restaurant.photos?.[0]?.url,
    telephone: restaurant.phone || undefined,
    menu: restaurant.menuUrl || undefined,
  };

  return (
    <>
      {/* SEO Meta Tags */}
      <Head>
        <title>{restaurant.name} - Dealandme</title>
        <meta name="description" content={`${restaurant.name} in ${restaurant.area}. ${restaurant.cuisine ? `Serving ${restaurant.cuisine} cuisine.` : ""} ${restaurant.offer?.isActive ? `Current offer: ${restaurant.offer.offerText}` : ""}`} />
        <meta property="og:title" content={`${restaurant.name} - Dealandme`} />
        <meta property="og:description" content={restaurant.description || `Discover great deals at ${restaurant.name}`} />
        {restaurant.photos?.[0]?.url && <meta property="og:image" content={restaurant.photos[0].url} />}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <CustomerNav />

        <main className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/restaurants" className="inline-flex items-center text-gray-600 hover:text-indigo-600 mb-4">
            <span className="mr-2">←</span> Back to restaurants
          </Link>

          {/* Photo Gallery */}
          {restaurant.photos && restaurant.photos.length > 0 && (
            <div className="mb-6">
              <div className="relative rounded-xl overflow-hidden bg-gray-200 h-64 md:h-80">
                <img
                  src={restaurant.photos[selectedPhotoIndex]?.url}
                  alt={restaurant.photos[selectedPhotoIndex]?.caption || restaurant.name}
                  className="w-full h-full object-cover"
                />
                {restaurant.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedPhotoIndex((prev) => (prev > 0 ? prev - 1 : restaurant.photos.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setSelectedPhotoIndex((prev) => (prev < restaurant.photos.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                    >
                      →
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {restaurant.photos.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPhotoIndex(idx)}
                          className={`w-2 h-2 rounded-full ${idx === selectedPhotoIndex ? "bg-white" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {restaurant.photos[selectedPhotoIndex]?.caption && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {restaurant.photos[selectedPhotoIndex].caption}
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">{restaurant.name}</h1>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-sm">
                    📍 {restaurant.area}
                  </span>
                  {restaurant.cuisine && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm">
                      🍽️ {restaurant.cuisine}
                    </span>
                  )}
                </div>
                {/* Rating Display */}
                {restaurant.totalReviews > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-500 text-lg">⭐</span>
                    <span className="font-semibold">{restaurant.avgRating.toFixed(1)}</span>
                    <span className="text-gray-500 text-sm">
                      ({restaurant.totalReviews} {language === "bn" ? "রিভিউ" : "reviews"})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {restaurant.description && (
              <p className="text-gray-600 mb-4">{restaurant.description}</p>
            )}

            {/* Contact & Menu Info */}
            <div className="flex flex-wrap gap-4 mb-4">
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="text-indigo-600 hover:underline flex items-center gap-1">
                  <span>📞</span> {restaurant.phone}
                </a>
              )}
              {restaurant.menuUrl && (
                <a href={restaurant.menuUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                  <span>📋</span> {language === "bn" ? "মেনু দেখুন" : "View Menu"}
                </a>
              )}
              {restaurant.address && (
                <span className="text-gray-600 flex items-center gap-1">
                  <span>🏠</span> {restaurant.address}
                </span>
              )}
            </div>

            {restaurant.offer && restaurant.offer.isActive ? (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-indigo-700 mb-2">Current Offer</h2>
                <p className="text-indigo-600 text-lg">🎁 {restaurant.offer.offerText}</p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-700">This restaurant currently has no active offer.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            {coupon ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                {couponMessage && (
                  <p className="text-green-600 mb-4 font-medium">{couponMessage}</p>
                )}
                <h3 className="text-lg font-semibold text-gray-700 mb-2">{t("restaurantDetail", "yourCouponCode")}</h3>
                <div className="bg-white border-2 border-dashed border-green-400 rounded-lg p-4 mb-4">
                  <p className="text-3xl font-mono font-bold text-green-600 tracking-wider">
                    {coupon.code}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {t("restaurantDetail", "showCodeToStaff")}
                </p>
                <p className="text-sm font-medium text-indigo-600">
                  {formatExpiry(coupon.expiresAt)}
                </p>
              </div>
            ) : (
              restaurant.offer?.isActive && (
                <button
                  onClick={handleGetCoupon}
                  disabled={generating}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></span>
                      {t("restaurantDetail", "generating")}
                    </span>
                  ) : (
                    t("restaurantDetail", "getCoupon")
                  )}
                </button>
              )
            )}
            
            <div className="mt-6">
              <CouponUsageGuide />
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>⭐</span>
                {language === "bn" ? "রিভিউ" : "Reviews"}
                {restaurant.totalReviews > 0 && (
                  <span className="text-sm font-normal text-gray-500">
                    ({restaurant.totalReviews})
                  </span>
                )}
              </h2>
              {canReview && !userReview && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  {language === "bn" ? "রিভিউ দিন" : "Write Review"}
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "bn" ? "রেটিং" : "Rating"}
                  </label>
                  {renderStars(userRating, true, setUserRating)}
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === "bn" ? "মন্তব্য (ঐচ্ছিক)" : "Comment (optional)"}
                  </label>
                  <textarea
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder={language === "bn" ? "আপনার অভিজ্ঞতা শেয়ার করুন..." : "Share your experience..."}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {submittingReview ? "..." : language === "bn" ? "জমা দিন" : "Submit"}
                  </button>
                  <button
                    onClick={() => setShowReviewForm(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    {language === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                </div>
              </div>
            )}

            {/* User's existing review */}
            {userReview && (
              <div className="bg-indigo-50 p-4 rounded-lg mb-4 border border-indigo-200">
                <p className="text-sm text-indigo-600 mb-2">
                  {language === "bn" ? "আপনার রিভিউ" : "Your Review"}
                </p>
                <div className="flex items-center gap-2 mb-1">
                  {renderStars(userReview.rating)}
                </div>
                {userReview.comment && (
                  <p className="text-gray-700">{userReview.comment}</p>
                )}
              </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.filter(r => r.id !== userReview?.id).map((review) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">{review.userPhone}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mt-1">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                {language === "bn" 
                  ? "এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!" 
                  : "No reviews yet. Be the first to review!"}
              </p>
            )}

            {!canReview && !userReview && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                {language === "bn" 
                  ? "রিভিউ দিতে এই রেস্টুরেন্টে কুপন ব্যবহার করুন" 
                  : "Redeem a coupon at this restaurant to leave a review"}
              </p>
            )}
          </div>

          <div className="text-center">
            <Link href="/restaurants" className="text-indigo-600 hover:underline">
              {t("restaurantDetail", "browseMore")}
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
