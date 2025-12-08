import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // First get all active restaurants with their offers
    const allRestaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
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
      createdAt: r.createdAt,
      offer: r.offer ? { id: r.offer.id, offerText: r.offer.offerText } : null,
    }));

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
    });
  } catch (error) {
    console.error("Get restaurants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}
