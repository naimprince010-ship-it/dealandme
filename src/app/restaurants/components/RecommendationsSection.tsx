"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

interface Recommendation {
  id: string;
  name: string;
  area: string;
  cuisine?: string | null;
  offer: { offerText: string; isActive: boolean; photoUrl?: string | null } | null;
  score: number;
  isFavorite: boolean;
  recentlyVisited: boolean;
}

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  showRecommendations: boolean;
}

export default function RecommendationsSection({
  recommendations,
  showRecommendations,
}: RecommendationsSectionProps) {
  const { language } = useLanguage();

  if (!showRecommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <h2
        className="text-base font-bold text-gray-800 mb-3 flex items-center"
        style={{ fontFamily: "var(--font-bangla), sans-serif" }}
      >
        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm mr-2">
          {language === "bn" ? "🎯 আপনার জন্য" : "🎯 For You"}
        </span>
      </h2>
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {recommendations.slice(0, 6).map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/restaurants/${restaurant.id}`}
              className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-44 flex-shrink-0"
            >
              <div className="h-24 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center relative">
                {restaurant.offer?.photoUrl ? (
                  <Image
                    src={restaurant.offer.photoUrl}
                    alt={restaurant.name}
                    width={176}
                    height={96}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-4xl">🍽️</span>
                )}
                {restaurant.isFavorite && (
                  <span className="absolute top-2 right-2 text-lg">❤️</span>
                )}
              </div>
              <div className="p-3">
                <h3
                  className="font-bold text-gray-800 text-sm leading-tight"
                  style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                >
                  {restaurant.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{restaurant.area}</p>
                {restaurant.offer && restaurant.offer.isActive && (
                  <div className="mt-2 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs truncate">
                    🎁 {restaurant.offer.offerText}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
