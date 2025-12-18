import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_PROMO_SETTINGS = {
  promoTextEn: "Share your code. When they place their first order, you both get 50% OFF!",
  promoTextBn: "আপনার কোড শেয়ার করুন। তারা প্রথম অর্ডার করলে, আপনি দুজনেই ৫০% ছাড় পাবেন!",
  shareTextEn: "Join Dealandme and get restaurant discounts! My referral code: {code}. Get 50% OFF on your first order!",
  shareTextBn: "Dealandme এ জয়েন করুন এবং রেস্টুরেন্ট ডিসকাউন্ট পান! আমার রেফারেল কোড: {code}। প্রথম অর্ডারে ৫০% ছাড় পাবেন!",
};

const DEFAULT_POINTS_PER_REFERRAL = 10;

async function getReferralPromoSettings() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: [
            "referral_promo_text_en",
            "referral_promo_text_bn",
            "referral_share_text_en",
            "referral_share_text_bn",
          ],
        },
      },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return {
      promoTextEn: settingsMap.referral_promo_text_en || DEFAULT_PROMO_SETTINGS.promoTextEn,
      promoTextBn: settingsMap.referral_promo_text_bn || DEFAULT_PROMO_SETTINGS.promoTextBn,
      shareTextEn: settingsMap.referral_share_text_en || DEFAULT_PROMO_SETTINGS.shareTextEn,
      shareTextBn: settingsMap.referral_share_text_bn || DEFAULT_PROMO_SETTINGS.shareTextBn,
    };
  } catch {
    return DEFAULT_PROMO_SETTINGS;
  }
}

async function getPointsPerReferral(): Promise<number> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "referral_points_per_success" },
    });
    return setting ? parseInt(setting.value) || DEFAULT_POINTS_PER_REFERRAL : DEFAULT_POINTS_PER_REFERRAL;
  } catch {
    return DEFAULT_POINTS_PER_REFERRAL;
  }
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "REF";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, points: true },
    });

    // Generate referral code if not exists
    if (!user?.referralCode) {
      let code = generateReferralCode();
      let attempts = 0;
      
      // Ensure unique code
      while (attempts < 10) {
        const existing = await prisma.user.findUnique({
          where: { referralCode: code },
        });
        if (!existing) break;
        code = generateReferralCode();
        attempts++;
      }

      user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true, points: true },
      });
    }

    const [referrals, promoSettings] = await Promise.all([
      prisma.referral.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: "desc" },
      }),
      getReferralPromoSettings(),
    ]);

    return NextResponse.json({
      referralCode: user?.referralCode,
      referralLink: `https://www.dealandme.com/login?ref=${user?.referralCode}`,
      totalReferrals: referrals.length,
      bonusAwarded: referrals.filter((r) => r.bonusAwarded).length,
      points: user?.points || 0,
      promoSettings,
    });
  } catch (error) {
    console.error("Get referral error:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral info" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredBy: true },
    });

    if (currentUser?.referredBy) {
      return NextResponse.json(
        { error: "You have already used a referral code" },
        { status: 400 }
      );
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    if (referrer.id === userId) {
      return NextResponse.json(
        { error: "You cannot use your own referral code" },
        { status: 400 }
      );
    }

    // Get points per referral from admin settings
    const pointsPerReferral = await getPointsPerReferral();

    await prisma.$transaction([
      // Update referred user
      prisma.user.update({
        where: { id: userId },
        data: { referredBy: referrer.id },
      }),
      // Create referral record
      prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: userId,
          bonusAwarded: true,
        },
      }),
      // Award points to referrer
      prisma.user.update({
        where: { id: referrer.id },
        data: { points: { increment: pointsPerReferral } },
      }),
      // Create points transaction record
      prisma.pointsTransaction.create({
        data: {
          userId: referrer.id,
          amount: pointsPerReferral,
          source: "REFERRAL",
          reason: `Referral by code ${referralCode.toUpperCase()}`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Referral code applied successfully!",
      pointsAwarded: pointsPerReferral,
    });
  } catch (error) {
    console.error("Apply referral error:", error);
    return NextResponse.json(
      { error: "Failed to apply referral code" },
      { status: 500 }
    );
  }
}
