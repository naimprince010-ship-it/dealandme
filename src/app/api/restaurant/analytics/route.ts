import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    if (session.type !== "RESTAURANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantId = session.id;

    // Get date ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of current week (Sunday)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // Get all redeemed coupons for this restaurant
    const allRedeemedCoupons = await prisma.coupon.findMany({
      where: {
        restaurantId,
        status: "USED",
      },
      select: {
        id: true,
        userId: true,
        redeemedAt: true,
        createdAt: true,
      },
      orderBy: { redeemedAt: "desc" },
    });

    // Calculate stats
    const todayRedeemed = allRedeemedCoupons.filter(
      (c) => c.redeemedAt && c.redeemedAt >= startOfToday
    ).length;

    const thisWeekRedeemed = allRedeemedCoupons.filter(
      (c) => c.redeemedAt && c.redeemedAt >= startOfWeek
    ).length;

    const lastWeekRedeemed = allRedeemedCoupons.filter(
      (c) => c.redeemedAt && c.redeemedAt >= startOfLastWeek && c.redeemedAt < startOfWeek
    ).length;

    const thisMonthRedeemed = allRedeemedCoupons.filter(
      (c) => c.redeemedAt && c.redeemedAt >= startOfMonth
    ).length;

    const totalRedeemed = allRedeemedCoupons.length;

    // Calculate repeat vs new customers
    const userCouponCounts: Record<string, number> = {};
    for (const coupon of allRedeemedCoupons) {
      userCouponCounts[coupon.userId] = (userCouponCounts[coupon.userId] || 0) + 1;
    }

    const uniqueCustomers = Object.keys(userCouponCounts).length;
    const repeatCustomers = Object.values(userCouponCounts).filter((count) => count > 1).length;
    const newCustomers = uniqueCustomers - repeatCustomers;

    // Weekly breakdown (last 4 weeks)
    const weeklyBreakdown = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekCoupons = allRedeemedCoupons.filter(
        (c) => c.redeemedAt && c.redeemedAt >= weekStart && c.redeemedAt < weekEnd
      );

      weeklyBreakdown.push({
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: weekEnd.toISOString().split("T")[0],
        redeemed: weekCoupons.length,
        uniqueCustomers: new Set(weekCoupons.map((c) => c.userId)).size,
      });
    }

    // Get generated coupons count
    const generatedCoupons = await prisma.coupon.count({
      where: { restaurantId },
    });

    // Conversion rate
    const conversionRate = generatedCoupons > 0 
      ? Math.round((totalRedeemed / generatedCoupons) * 100) 
      : 0;

    return NextResponse.json({
      summary: {
        todayRedeemed,
        thisWeekRedeemed,
        lastWeekRedeemed,
        thisMonthRedeemed,
        totalRedeemed,
        generatedCoupons,
        conversionRate,
      },
      customers: {
        uniqueCustomers,
        repeatCustomers,
        newCustomers,
        repeatRate: uniqueCustomers > 0 
          ? Math.round((repeatCustomers / uniqueCustomers) * 100) 
          : 0,
      },
      weeklyBreakdown,
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
