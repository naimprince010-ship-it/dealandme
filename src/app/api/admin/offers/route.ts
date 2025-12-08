import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin login required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const area = searchParams.get("area");
    const status = searchParams.get("status"); // "active" or "paused"

    // Build where clause for restaurants with offers
    const whereClause: {
      offer: { isNot: null };
      area?: string;
    } = {
      offer: { isNot: null },
    };

    if (area) {
      whereClause.area = area;
    }

    // Get all restaurants with offers
    const restaurants = await prisma.restaurant.findMany({
      where: whereClause,
      include: {
        offer: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Filter by offer status if specified
    let filteredRestaurants = restaurants;
    if (status === "active") {
      filteredRestaurants = restaurants.filter((r) => r.offer?.isActive);
    } else if (status === "paused") {
      filteredRestaurants = restaurants.filter((r) => !r.offer?.isActive);
    }

    // Get unique areas for filter dropdown
    const allRestaurants = await prisma.restaurant.findMany({
      where: { offer: { isNot: null } },
      select: { area: true },
      distinct: ["area"],
    });
    const areas = allRestaurants.map((r) => r.area).sort();

    // Format response
    const offers = filteredRestaurants.map((restaurant) => ({
      id: restaurant.offer!.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      area: restaurant.area,
      title: restaurant.offer!.title,
      discountType: restaurant.offer!.discountType,
      discountValue: restaurant.offer!.discountValue,
      maxDiscountAmount: restaurant.offer!.maxDiscountAmount,
      offerText: restaurant.offer!.offerText,
      isActive: restaurant.offer!.isActive,
      offPeakBoost: restaurant.offPeakBoost,
      updatedAt: restaurant.offer!.updatedAt,
    }));

    return NextResponse.json({
      offers,
      areas,
      total: offers.length,
    });
  } catch (error) {
    console.error("Get offers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}
