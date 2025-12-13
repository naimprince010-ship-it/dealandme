"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

interface Restaurant {
  id: string;
  name: string;
  area: string;
  cuisine?: string | null;
  description: string | null;
  offer: {
    id: string;
    offerText: string;
    photoUrl?: string | null;
    discountType?: string | null;
    discountValue?: number | null;
  } | null;
}

interface GroupedRestaurants {
  [area: string]: Restaurant[];
}

interface RestaurantListProps {
  groupedRestaurants: GroupedRestaurants;
  favorites: Set<string>;
  selectedArea: string;
  onToggleFavorite: (restaurantId: string) => void;
  searchQuery?: string;
}

// Helper function to highlight matching text
function HighlightText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={index} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</span>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </>
  );
}

export default function RestaurantList({
  groupedRestaurants,
  favorites,
  selectedArea,
  onToggleFavorite,
  searchQuery,
}: RestaurantListProps) {
  const { language } = useLanguage();

  const filteredAreas =
    selectedArea === "all"
      ? Object.keys(groupedRestaurants)
      : Object.keys(groupedRestaurants).filter((area) => area === selectedArea);

  const getDiscountBadge = (
    discountType: string | null | undefined,
    discountValue: number | null | undefined
  ) => {
    if (!discountValue) return null;
    if (discountType === "PERCENTAGE") {
      return language === "bn" ? `${discountValue}% ছাড়` : `${discountValue}% OFF`;
    }
    return language === "bn" ? `৳${discountValue} ছাড়` : `৳${discountValue} OFF`;
  };

  if (filteredAreas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🔍</span>
        </div>
        <p
          className="text-gray-500 text-center"
          style={{ fontFamily: "var(--font-bangla), sans-serif" }}
        >
          {language === "bn"
            ? "এই এলাকায় কোনো রেস্টুরেন্ট নেই"
            : "No restaurants in this area"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredAreas.map((area) => (
        <section key={area}>
          <h2
            className="text-sm font-bold text-gray-600 mb-3 flex items-center"
            style={{ fontFamily: "var(--font-bangla), sans-serif" }}
          >
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs">
              📍 {area}
            </span>
          </h2>
          <div className="space-y-3">
            {groupedRestaurants[area].map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="flex">
                  <div className="w-28 h-28 flex-shrink-0 relative">
                    {restaurant.offer?.photoUrl ? (
                      <Image
                        src={restaurant.offer.photoUrl}
                        alt={restaurant.name}
                        width={112}
                        height={112}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                    {restaurant.offer?.discountValue && (
                      <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                        {getDiscountBadge(
                          restaurant.offer.discountType,
                          restaurant.offer.discountValue
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3
                          className="font-bold text-gray-800 text-base leading-tight"
                          style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                        >
                          <HighlightText text={restaurant.name} query={searchQuery} />
                        </h3>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            onToggleFavorite(restaurant.id);
                          }}
                          className="ml-2 flex-shrink-0 transition-transform active:scale-90"
                        >
                          <svg
                            className={`w-6 h-6 ${
                              favorites.has(restaurant.id)
                                ? "text-rose-500"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                        </button>
                      </div>
                      {restaurant.offer && (
                        <div
                          className="mt-2 bg-emerald-50 text-emerald-700 px-2 py-1.5 rounded-lg text-xs"
                          style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                        >
                          🎁 {restaurant.offer.offerText}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/restaurants/${restaurant.id}`}
                      className="mt-2 inline-flex items-center justify-center px-4 py-1.5 border-2 border-emerald-500 text-emerald-600 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition-colors"
                      style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                    >
                      {language === "bn" ? "অফার দেখুন" : "View Offer"}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
