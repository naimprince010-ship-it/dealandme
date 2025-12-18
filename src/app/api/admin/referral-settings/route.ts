import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const REFERRAL_SETTINGS_KEYS = [
  "referral_promo_text_en",
  "referral_promo_text_bn",
  "referral_share_text_en",
  "referral_share_text_bn",
];

const DEFAULT_VALUES: Record<string, string> = {
  referral_promo_text_en: "Share your code. When they place their first order, you both get 50% OFF!",
  referral_promo_text_bn: "আপনার কোড শেয়ার করুন। তারা প্রথম অর্ডার করলে, আপনি দুজনেই ৫০% ছাড় পাবেন!",
  referral_share_text_en: "Join Dealandme and get restaurant discounts! My referral code: {code}. Get 50% OFF on your first order!",
  referral_share_text_bn: "Dealandme এ জয়েন করুন এবং রেস্টুরেন্ট ডিসকাউন্ট পান! আমার রেফারেল কোড: {code}। প্রথম অর্ডারে ৫০% ছাড় পাবেন!",
};

export async function GET() {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: REFERRAL_SETTINGS_KEYS } },
    });

    const settingsMap: Record<string, string> = {};
    for (const key of REFERRAL_SETTINGS_KEYS) {
      const setting = settings.find((s) => s.key === key);
      settingsMap[key] = setting?.value || DEFAULT_VALUES[key];
    }

    return NextResponse.json({
      promoTextEn: settingsMap.referral_promo_text_en,
      promoTextBn: settingsMap.referral_promo_text_bn,
      shareTextEn: settingsMap.referral_share_text_en,
      shareTextBn: settingsMap.referral_share_text_bn,
    });
  } catch (error) {
    console.error("Error fetching referral settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { promoTextEn, promoTextBn, shareTextEn, shareTextBn } = await request.json();

    const updates = [
      { key: "referral_promo_text_en", value: promoTextEn },
      { key: "referral_promo_text_bn", value: promoTextBn },
      { key: "referral_share_text_en", value: shareTextEn },
      { key: "referral_share_text_bn", value: shareTextBn },
    ];

    for (const { key, value } of updates) {
      if (value && typeof value === "string") {
        await prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Referral settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating referral settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
