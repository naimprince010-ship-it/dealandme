"use client";

import { useLanguage } from "@/lib/LanguageContext";

interface AreaFilterChipsProps {
  // Array of actual restaurant area names (from groupedRestaurants keys)
  restaurantAreas: string[];
  selectedArea: string;
  onSelectArea: (area: string) => void;
}

export default function AreaFilterChips({
  restaurantAreas,
  selectedArea,
  onSelectArea,
}: AreaFilterChipsProps) {
  const { language } = useLanguage();

  return (
    <div className="mb-6 overflow-x-auto -mx-4 px-4">
      <div className="flex gap-2 pb-2">
        <button
          onClick={() => onSelectArea("all")}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
            selectedArea === "all"
              ? "bg-emerald-500 text-white shadow-sm"
              : "bg-white/80 text-gray-600 hover:bg-white"
          }`}
          style={{ fontFamily: "var(--font-bangla), sans-serif" }}
        >
          {language === "bn" ? "সব এলাকা" : "All Areas"}
        </button>
        {restaurantAreas.map((area) => (
          <button
            key={area}
            onClick={() => onSelectArea(area)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              selectedArea === area
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-white/80 text-gray-600 hover:bg-white"
            }`}
            style={{ fontFamily: "var(--font-bangla), sans-serif" }}
          >
            {area}
          </button>
        ))}
      </div>
    </div>
  );
}
