import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin login required" },
        { status: 401 }
      );
    }

    const now = new Date();

    // Get all stats in parallel for efficiency
    const [
      totalCustomers,
      totalRestaurants,
      activeRestaurants,
      activeOffers,
      totalCoupons,
      redeemedCoupons,
      expiredCoupons,
    ] = await Promise.all([
      // Total customers
      prisma.user.count(),

      // Total restaurants
      prisma.restaurant.count(),

      // Active restaurants
      prisma.restaurant.count({
        where: { isActive: true },
      }),

      // Active offers
      prisma.offer.count({
        where: { isActive: true },
      }),

      // Total coupons generated
      prisma.coupon.count(),

      // Total redeemed coupons
      prisma.coupon.count({
        where: { status: "USED" },
      }),

      // Expired coupons (status EXPIRED or UNUSED with expiresAt < now)
      prisma.coupon.count({
        where: {
          OR: [
            { status: "EXPIRED" },
            {
              status: "UNUSED",
              expiresAt: { lt: now },
            },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      customers: {
        total: totalCustomers,
      },
      restaurants: {
        total: totalRestaurants,
        active: activeRestaurants,
      },
      offers: {
        active: activeOffers,
      },
      coupons: {
        total: totalCoupons,
        redeemed: redeemedCoupons,
        expired: expiredCoupons,
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
