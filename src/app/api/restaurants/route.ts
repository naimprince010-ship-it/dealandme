import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
        offer: {
          isActive: true,
        },
      },
      include: {
        offer: {
          select: {
            id: true,
            offerText: true,
          },
        },
      },
      orderBy: [
        { area: "asc" },
        { name: "asc" },
      ],
    });

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
