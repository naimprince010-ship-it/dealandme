"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/LanguageContext";

interface RecentlyVisited {
  id: string;
  name: string;
  area: string;
  cuisine?: string | null;
  offer: { offerText: string; isActive: boolean; photoUrl?: string | null } | null;
  visitedAt: string;
}

interface RecentlyVisitedSectionProps {
  recentlyVisited: RecentlyVisited[];
}

export default function RecentlyVisitedSection({
  recentlyVisited,
}: RecentlyVisitedSectionProps) {
  const { language } = useLanguage();

  if (recentlyVisited.length === 0) {
    return null;
  }

  return (
    <section className="mb-6">
      <h2
        className="text-base font-bold text-gray-800 mb-3 flex items-center"
        style={{ fontFamily: "var(--font-bangla), sans-serif" }}
      >
        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm mr-2">
          {language === "bn" ? "🕐 সম্প্রতি দেখেছেন" : "🕐 Recently Visited"}
        </span>
      </h2>
      <div className="overflow-x-auto -mx-4 px-4 pb-2">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {recentlyVisited.slice(0, 6).map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/restaurants/${restaurant.id}`}
              className="bg-white/95 rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-40 flex-shrink-0"
            >
              <div className="h-20 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                {restaurant.offer?.photoUrl ? (
                  <Image
                    src={restaurant.offer.photoUrl}
                    alt={restaurant.name}
                    width={160}
                    height={80}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-3xl">🍽️</span>
                )}
              </div>
              <div className="p-2.5">
                <h3
                  className="font-bold text-gray-800 text-sm leading-tight truncate"
                  style={{ fontFamily: "var(--font-bangla), sans-serif" }}
                >
                  {restaurant.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{restaurant.area}</p>
                {restaurant.offer && restaurant.offer.isActive && (
                  <div className="mt-1.5 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg text-xs truncate">
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
