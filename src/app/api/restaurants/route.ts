import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Check if current time is in off-peak hours (3-6pm Bangladesh time, UTC+6)
function isOffPeakHours(): boolean {
  const now = new Date();
  // Bangladesh is UTC+6
  const bdHour = (now.getUTCHours() + 6) % 24;
  return bdHour >= 15 && bdHour < 18; // 3pm to 6pm
}

export async function GET() {
  try {
    const offPeak = isOffPeakHours();

    // First get all active restaurants with their offers
    // Exclude restaurants with payment overdue (auto-blocked)
    const allRestaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
        paymentOverdue: false,
      },
      include: {
        offer: {
          select: {
            id: true,
            offerText: true,
            isActive: true,
          },
        },
      },
      orderBy: [
        { area: "asc" },
        { name: "asc" },
      ],
    });

    // Filter to only include restaurants with active offers
    // Also exclude sensitive fields like passwordHash
    const restaurants = allRestaurants.filter(
      (r) => r.offer && r.offer.isActive
    ).map((r) => ({
      id: r.id,
      name: r.name,
      area: r.area,
      description: r.description,
      isActive: r.isActive,
      offPeakBoost: r.offPeakBoost,
      createdAt: r.createdAt,
      offer: r.offer ? { id: r.offer.id, offerText: r.offer.offerText } : null,
    }));

    // Sort: during off-peak hours, boosted restaurants come first
    if (offPeak) {
      restaurants.sort((a, b) => {
        if (a.offPeakBoost && !b.offPeakBoost) return -1;
        if (!a.offPeakBoost && b.offPeakBoost) return 1;
        return 0;
      });
    }

    // Group by area
    const groupedByArea: Record<string, typeof restaurants> = {};
    for (const restaurant of restaurants) {
      if (!groupedByArea[restaurant.area]) {
        groupedByArea[restaurant.area] = [];
      }
      groupedByArea[restaurant.area].push(restaurant);
    }

    return NextResponse.json({
      restaurants,
      groupedByArea,
      isOffPeakHours: offPeak,
    });
  } catch (error) {
    console.error("Get restaurants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}
