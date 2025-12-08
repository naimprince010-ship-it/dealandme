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

    // Get today's date range (start of day to end of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's generated coupons count
    const generatedToday = await prisma.coupon.count({
      where: {
        restaurantId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get today's redeemed (USED) coupons count
    const redeemedToday = await prisma.coupon.count({
      where: {
        restaurantId,
        status: "USED",
        redeemedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get pending coupons (generated today but not yet used or expired)
    const pendingToday = await prisma.coupon.count({
      where: {
        restaurantId,
        status: "UNUSED",
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Get expired coupons from today
    const expiredToday = await prisma.coupon.count({
      where: {
        restaurantId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        OR: [
          { status: "EXPIRED" },
          {
            status: "UNUSED",
            expiresAt: {
              lte: new Date(),
            },
          },
        ],
      },
    });

    return NextResponse.json({
      stats: {
        generated: generatedToday,
        redeemed: redeemedToday,
        pending: pendingToday,
        expired: expiredToday,
      },
    });
  } catch (error) {
    console.error("Daily stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily stats" },
      { status: 500 }
    );
  }
}
