import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BadgeCriteriaType } from "@prisma/client";

// GET - Get user stats for badges
export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run all queries in parallel for better performance
    const [couponsUsed, restaurantsTried, couponsGenerated, referralsCount, user, allBadges] = await Promise.all([
      // Get total coupons used
      prisma.coupon.count({
        where: {
          userId: session.userId,
          status: "USED",
        },
      }),
      // Get unique restaurants tried (where coupon was used)
      prisma.coupon.groupBy({
        by: ["restaurantId"],
        where: {
          userId: session.userId,
          status: "USED",
        },
      }),
      // Get total coupons generated
      prisma.coupon.count({
        where: {
          userId: session.userId,
        },
      }),
      // Get referral count
      prisma.referral.count({
        where: {
          referrerId: session.userId,
        },
      }),
      // Get user's referral code and points
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { referralCode: true, points: true },
      }),
      // Get all active badges from database
      prisma.badge.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    // Calculate which badges are unlocked based on user stats
    const statsMap: Record<BadgeCriteriaType, number> = {
      COUPONS_USED: couponsUsed,
      COUPONS_GENERATED: couponsGenerated,
      RESTAURANTS_VISITED: restaurantsTried.length,
      REFERRALS: referralsCount,
    };

    // Build badges array with unlock status
    const badges = allBadges.map(badge => {
      const userStat = statsMap[badge.criteriaType];
      const isUnlocked = userStat >= badge.threshold;
      return {
        id: badge.key,
        name: badge.nameEn,
        namebn: badge.nameBn,
        icon: badge.icon,
        threshold: badge.threshold,
        criteriaType: badge.criteriaType,
        isUnlocked,
        progress: Math.min(userStat, badge.threshold),
      };
    });

    return NextResponse.json({
      stats: {
        couponsUsed,
        couponsGenerated,
        restaurantsTried: restaurantsTried.length,
        referralsCount,
        referralCode: user?.referralCode || null,
        points: user?.points || 0,
      },
      badges,
    });
  } catch (error) {
    console.error("Get user stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
