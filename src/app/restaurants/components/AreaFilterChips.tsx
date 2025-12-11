"use client";

import { useLanguage } from "@/lib/LanguageContext";

interface Area {
  id: string;
  nameEn: string;
  nameBn: string;
}

interface AreaFilterChipsProps {
  areas: Area[];
  selectedArea: string;
  onSelectArea: (area: string) => void;
}

export default function AreaFilterChips({
  areas,
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
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => onSelectArea(area.nameEn)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              selectedArea === area.nameEn
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-white/80 text-gray-600 hover:bg-white"
            }`}
            style={{ fontFamily: "var(--font-bangla), sans-serif" }}
          >
            {language === "bn" ? area.nameBn : area.nameEn}
          </button>
        ))}
      </div>
    </div>
  );
}
