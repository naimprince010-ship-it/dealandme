import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [
      totalCustomers,
      activeCustomers,
      onlineCustomers,
      totalRestaurants,
      activeRestaurants,
      onlineRestaurants,
      customerAppInstalls,
      restaurantAppInstalls,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActiveAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.user.count({
        where: {
          lastActiveAt: { gte: fiveMinutesAgo },
        },
      }),
      prisma.restaurant.count(),
      prisma.restaurant.count({
        where: {
          lastActiveAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.restaurant.count({
        where: {
          lastActiveAt: { gte: fiveMinutesAgo },
        },
      }),
      prisma.appInstall.count({
        where: { appType: "CUSTOMER" },
      }),
      prisma.appInstall.count({
        where: { appType: "RESTAURANT" },
      }),
    ]);

    const inactiveCustomers = totalCustomers - activeCustomers;
    const inactiveRestaurants = totalRestaurants - activeRestaurants;

    return NextResponse.json({
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: inactiveCustomers,
        online: onlineCustomers,
        appInstalls: customerAppInstalls,
      },
      restaurants: {
        total: totalRestaurants,
        active: activeRestaurants,
        inactive: inactiveRestaurants,
        online: onlineRestaurants,
        appInstalls: restaurantAppInstalls,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
