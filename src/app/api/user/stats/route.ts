import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET - Get user stats for badges
export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run all queries in parallel for better performance
    const [couponsUsed, restaurantsTried, couponsGenerated, referralsCount, user] = await Promise.all([
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
      // Get user's referral code
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { referralCode: true },
      }),
    ]);

    // Calculate badges
    const badges = [];

    // Coupon usage badges
    if (couponsUsed >= 1) badges.push({ id: "first_coupon", name: "First Coupon", namebn: "প্রথম কুপন", icon: "🎫" });
    if (couponsUsed >= 5) badges.push({ id: "coupon_5", name: "5 Coupons Used", namebn: "৫টি কুপন ব্যবহার", icon: "🎟️" });
    if (couponsUsed >= 10) badges.push({ id: "coupon_10", name: "10 Coupons Used", namebn: "১০টি কুপন ব্যবহার", icon: "🏆" });
    if (couponsUsed >= 25) badges.push({ id: "coupon_25", name: "25 Coupons Used", namebn: "২৫টি কুপন ব্যবহার", icon: "👑" });

    // Restaurant exploration badges
    if (restaurantsTried.length >= 1) badges.push({ id: "first_restaurant", name: "First Restaurant", namebn: "প্রথম রেস্টুরেন্ট", icon: "🍽️" });
    if (restaurantsTried.length >= 3) badges.push({ id: "restaurant_3", name: "3 Restaurants Tried", namebn: "৩টি রেস্টুরেন্ট", icon: "🌟" });
    if (restaurantsTried.length >= 5) badges.push({ id: "restaurant_5", name: "5 Restaurants Tried", namebn: "৫টি রেস্টুরেন্ট", icon: "⭐" });
    if (restaurantsTried.length >= 10) badges.push({ id: "restaurant_10", name: "Explorer", namebn: "এক্সপ্লোরার", icon: "🗺️" });

    // Referral badges
    if (referralsCount >= 1) badges.push({ id: "first_referral", name: "First Referral", namebn: "প্রথম রেফারেল", icon: "🤝" });
    if (referralsCount >= 5) badges.push({ id: "referral_5", name: "5 Referrals", namebn: "৫টি রেফারেল", icon: "💫" });

    return NextResponse.json({
      stats: {
        couponsUsed,
        couponsGenerated,
        restaurantsTried: restaurantsTried.length,
        referralsCount,
        referralCode: user?.referralCode || null,
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
