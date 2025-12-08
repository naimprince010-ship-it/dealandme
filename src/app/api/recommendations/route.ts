import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET - Get personalized restaurant recommendations
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.userType !== "CUSTOMER" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    // Get user's favorite restaurants
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { restaurant: true },
    });
    const favoriteIds = new Set(favorites.map((f) => f.restaurantId));
    const favoriteCuisines = favorites
      .map((f) => f.restaurant.cuisine)
      .filter(Boolean) as string[];
    const favoriteAreas = favorites.map((f) => f.restaurant.area);

    // Get user's visit history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const visits = await prisma.visitHistory.findMany({
      where: {
        userId,
        visitedAt: { gte: thirtyDaysAgo },
      },
      include: { restaurant: true },
    });
    const visitedIds = new Set(visits.map((v) => v.restaurantId));
    const visitedCuisines = visits
      .map((v) => v.restaurant.cuisine)
      .filter(Boolean) as string[];
    const visitedAreas = visits.map((v) => v.restaurant.area);

    // Get user's coupon history
    const coupons = await prisma.coupon.findMany({
      where: { userId },
      include: { restaurant: true },
    });
    const couponCuisines = coupons
      .map((c) => c.restaurant.cuisine)
      .filter(Boolean) as string[];
    const couponAreas = coupons.map((c) => c.restaurant.area);

    // Combine all preferences
    const allCuisines = [...favoriteCuisines, ...visitedCuisines, ...couponCuisines];
    const allAreas = [...favoriteAreas, ...visitedAreas, ...couponAreas];

    // Count cuisine preferences
    const cuisineCount: Record<string, number> = {};
    allCuisines.forEach((c) => {
      cuisineCount[c] = (cuisineCount[c] || 0) + 1;
    });

    // Count area preferences
    const areaCount: Record<string, number> = {};
    allAreas.forEach((a) => {
      areaCount[a] = (areaCount[a] || 0) + 1;
    });

    // Get all active restaurants with offers
    const restaurants = await prisma.restaurant.findMany({
      where: {
        isActive: true,
        offer: {
          isActive: true,
        },
      },
      include: {
        offer: true,
      },
    });

    // Score each restaurant
    const scoredRestaurants = restaurants.map((restaurant) => {
      let score = 0;

      // Boost for matching cuisine (highest weight)
      if (restaurant.cuisine && cuisineCount[restaurant.cuisine]) {
        score += cuisineCount[restaurant.cuisine] * 10;
      }

      // Boost for matching area
      if (areaCount[restaurant.area]) {
        score += areaCount[restaurant.area] * 5;
      }

      // Boost for favorites (but don't show at top since user already knows them)
      if (favoriteIds.has(restaurant.id)) {
        score += 3;
      }

      // Small boost for recently visited (familiarity)
      if (visitedIds.has(restaurant.id)) {
        score += 2;
      }

      // Boost for off-peak boost during off-peak hours
      const now = new Date();
      const bdHour = (now.getUTCHours() + 6) % 24;
      if (restaurant.offPeakBoost && bdHour >= 15 && bdHour < 18) {
        score += 15;
      }

      return {
        ...restaurant,
        score,
        isFavorite: favoriteIds.has(restaurant.id),
        recentlyVisited: visitedIds.has(restaurant.id),
      };
    });

    // Sort by score (descending)
    scoredRestaurants.sort((a, b) => b.score - a.score);

    // Format response
    const recommendations = scoredRestaurants.slice(0, 20).map((r) => ({
      id: r.id,
      name: r.name,
      area: r.area,
      cuisine: r.cuisine,
      description: r.description,
      isActive: r.isActive,
      offer: r.offer
        ? {
            offerText: r.offer.offerText,
            isActive: r.offer.isActive,
          }
        : null,
      score: r.score,
      isFavorite: r.isFavorite,
      recentlyVisited: r.recentlyVisited,
    }));

    // Get top cuisines for user
    const topCuisines = Object.entries(cuisineCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cuisine]) => cuisine);

    // Get top areas for user
    const topAreas = Object.entries(areaCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area]) => area);

    return NextResponse.json({
      recommendations,
      preferences: {
        topCuisines,
        topAreas,
        totalFavorites: favorites.length,
        totalVisits: visits.length,
      },
    });
  } catch (error) {
    console.error("Get recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
