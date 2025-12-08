import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRestaurant } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const restaurant = await getRestaurant();
    if (!restaurant) {
      return NextResponse.json(
        { error: "Unauthorized: Restaurant login required" },
        { status: 401 }
      );
    }

    // Get optional date filters from query params
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    // Build the where clause
    const whereClause: {
      restaurantId: string;
      status: "USED";
      redeemedAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      restaurantId: restaurant.id,
      status: "USED",
    };

    // Add date filters if provided
    if (fromDate || toDate) {
      whereClause.redeemedAt = {};
      if (fromDate) {
        whereClause.redeemedAt.gte = new Date(fromDate);
      }
      if (toDate) {
        // Set to end of day
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        whereClause.redeemedAt.lte = endDate;
      }
    }

    const redemptions = await prisma.coupon.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            phone: true,
          },
        },
        offer: {
          select: {
            offerText: true,
          },
        },
      },
      orderBy: {
        redeemedAt: "desc",
      },
    });

    // Get summary stats
    const totalRedemptions = redemptions.length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayRedemptions = redemptions.filter(
      (r) => r.redeemedAt && r.redeemedAt >= todayStart
    ).length;

    return NextResponse.json({
      redemptions: redemptions.map((r) => ({
        id: r.id,
        code: r.code,
        customerPhone: r.user.phone,
        offerText: r.offer.offerText,
        redeemedAt: r.redeemedAt,
        createdAt: r.createdAt,
      })),
      stats: {
        total: totalRedemptions,
        today: todayRedemptions,
      },
    });
  } catch (error) {
    console.error("Get redemptions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch redemptions" },
      { status: 500 }
    );
  }
}
