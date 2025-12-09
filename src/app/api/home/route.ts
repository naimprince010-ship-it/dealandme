import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    const [categories, featuredOffers, popularRestaurants, allRestaurants] = await Promise.all([
      prisma.homeCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.offer.findMany({
        where: {
          isActive: true,
          isFeatured: true,
          restaurant: { isActive: true, paymentOverdue: false },
        },
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              area: true,
              cuisine: true,
              latitude: true,
              longitude: true,
            },
          },
        },
        orderBy: { featuredSortOrder: "asc" },
        take: 10,
      }),
      prisma.restaurant.findMany({
        where: {
          isActive: true,
          isPopular: true,
          paymentOverdue: false,
        },
        include: {
          offer: {
            select: {
              id: true,
              offerText: true,
              discountType: true,
              discountValue: true,
              photoUrl: true,
              isActive: true,
            },
          },
        },
        orderBy: { popularSortOrder: "asc" },
        take: 20,
      }),
      prisma.restaurant.findMany({
        where: {
          isActive: true,
          paymentOverdue: false,
        },
        include: {
          offer: {
            where: { isActive: true },
            select: {
              id: true,
              offerText: true,
              discountType: true,
              discountValue: true,
              photoUrl: true,
            },
          },
        },
      }),
    ]);

    let nearbyRestaurants: typeof allRestaurants = [];
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      nearbyRestaurants = allRestaurants
        .filter((r) => r.latitude && r.longitude)
        .map((r) => {
          const distance = calculateDistance(
            userLat,
            userLng,
            r.latitude!,
            r.longitude!
          );
          return { ...r, distance };
        })
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 10);
    }

    return NextResponse.json({
      categories,
      featuredOffers,
      popularRestaurants,
      nearbyRestaurants,
    });
  } catch (error) {
    console.error("Error fetching home data:", error);
    return NextResponse.json(
      { error: "Failed to fetch home data" },
      { status: 500 }
    );
  }
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
