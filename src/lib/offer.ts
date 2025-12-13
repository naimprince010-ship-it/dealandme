// Shared utilities for offer management

// Offer applies to options with labels
export const APPLIES_TO_OPTIONS = [
  { value: "TOTAL_BILL", en: "Total Bill", bn: "সম্পূর্ণ বিল" },
  { value: "SELECTED_ITEMS", en: "Selected Items", bn: "নির্বাচিত আইটেম" },
  { value: "DINE_IN_ONLY", en: "Dine-in Only", bn: "শুধু ডাইন-ইন" },
  { value: "TAKEAWAY_ONLY", en: "Takeaway Only", bn: "শুধু টেকঅ্যাওয়ে" },
  { value: "FIRST_ORDER", en: "First Order", bn: "প্রথম অর্ডার" },
  { value: "OTHER", en: "Other", bn: "অন্যান্য" },
] as const;

export type OfferAppliesToType = typeof APPLIES_TO_OPTIONS[number]["value"];

// Get applies to label
export function getAppliesToLabel(
  appliesTo: OfferAppliesToType | null | undefined,
  language: "en" | "bn" = "en"
): string {
  if (!appliesTo) return "";
  const option = APPLIES_TO_OPTIONS.find((o) => o.value === appliesTo);
  return option ? option[language] : "";
}

// Check if current time is in off-peak hours (3-6pm Bangladesh time, UTC+6)
export function isOffPeakHours(date: Date = new Date()): boolean {
  const bdHour = (date.getUTCHours() + 6) % 24;
  return bdHour >= 15 && bdHour < 18;
}

// Get off-peak boost status text
export function getOffPeakStatus(
  isEnabled: boolean,
  date: Date = new Date()
): { isActive: boolean; label: string; labelBn: string } {
  if (!isEnabled) {
    return {
      isActive: false,
      label: "Boost Off",
      labelBn: "বুস্ট বন্ধ",
    };
  }

  const isActive = isOffPeakHours(date);
  return {
    isActive,
    label: isActive
      ? "Boost Active Now"
      : "Boost Scheduled (Next: Tomorrow 3 PM)",
    labelBn: isActive
      ? "বুস্ট এখন সক্রিয়"
      : "বুস্ট নির্ধারিত (পরবর্তী: আগামীকাল ৩টা)",
  };
}

// Format offer text from structured fields
export function formatOfferText(offer: {
  discountType?: "PERCENTAGE" | "FLAT" | null;
  discountValue?: number | null;
  maxDiscountAmount?: number | null;
  title?: string | null;
  appliesTo?: OfferAppliesToType | null;
}): string {
  // If we have structured discount info, generate text from it
  if (offer.discountType && offer.discountValue) {
    let baseText = "";
    if (offer.discountType === "PERCENTAGE") {
      if (offer.maxDiscountAmount && offer.maxDiscountAmount > 0) {
        baseText = `${offer.discountValue}% off (Up to ৳${offer.maxDiscountAmount})`;
      } else {
        baseText = `${offer.discountValue}% off`;
      }
    } else {
      baseText = `৳${offer.discountValue} off`;
    }

    // Add applies to suffix
    if (offer.appliesTo && offer.appliesTo !== "OTHER") {
      const appliesToLabel = getAppliesToLabel(offer.appliesTo, "en");
      if (appliesToLabel) {
        baseText += ` on ${appliesToLabel.toLowerCase()}`;
      }
    }

    return baseText;
  }

  // Fallback to title if no discount info
  if (offer.title) {
    return offer.title;
  }

  return "";
}

// Format offer text in Bangla
export function formatOfferTextBn(offer: {
  discountType?: "PERCENTAGE" | "FLAT" | null;
  discountValue?: number | null;
  maxDiscountAmount?: number | null;
  title?: string | null;
  appliesTo?: OfferAppliesToType | null;
}): string {
  // If we have structured discount info, generate text from it
  if (offer.discountType && offer.discountValue) {
    let baseText = "";
    if (offer.discountType === "PERCENTAGE") {
      if (offer.maxDiscountAmount && offer.maxDiscountAmount > 0) {
        baseText = `${offer.discountValue}% ছাড় (সর্বোচ্চ ৳${offer.maxDiscountAmount})`;
      } else {
        baseText = `${offer.discountValue}% ছাড়`;
      }
    } else {
      baseText = `৳${offer.discountValue} ছাড়`;
    }

    // Add applies to suffix
    if (offer.appliesTo && offer.appliesTo !== "OTHER") {
      const appliesToLabel = getAppliesToLabel(offer.appliesTo, "bn");
      if (appliesToLabel) {
        baseText += ` - ${appliesToLabel}`;
      }
    }

    return baseText;
  }

  // Fallback to title if no discount info
  if (offer.title) {
    return offer.title;
  }

  return "";
}

// Quick suggestion chips for offer title
export const TITLE_SUGGESTIONS = [
  { en: "Flat 50% Off", bn: "৫০% ছাড়" },
  { en: "Buy 1 Get 1", bn: "১টা কিনলে ১টা ফ্রি" },
  { en: "Free Drinks", bn: "ফ্রি ড্রিংকস" },
  { en: "Lunch Offer", bn: "লাঞ্চ অফার" },
];

// Quick suggestion chips for terms
export const TERMS_SUGGESTIONS = [
  { en: "Dine-in Only", bn: "শুধু ডাইন-ইন" },
  { en: "No Cash Refund", bn: "ক্যাশ রিফান্ড নেই" },
  { en: "Valid for 2 People", bn: "২ জনের জন্য প্রযোজ্য" },
  { en: "Limited Time Only", bn: "সীমিত সময়ের জন্য" },
];
