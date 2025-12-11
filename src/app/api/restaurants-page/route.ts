import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/auth";

function isOffPeakHours(): boolean {
  const now = new Date();
  const bdHour = (now.getUTCHours() + 6) % 24;
  return bdHour >= 15 && bdHour < 18;
}

export async function GET() {
  const apiStart = Date.now();
  
  try {
    const t0 = Date.now();
    const customer = await getCustomer();
    const authTime = Date.now() - t0;
    
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = customer.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const offPeak = isOffPeakHours();

    // Run all queries in PARALLEL for maximum performance
    const queryStart = Date.now();
    const [
      allRestaurants,
      favorites,
      visits,
      coupons,
      areas,
    ] = await Promise.all([
      prisma.restaurant.findMany({
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
              photoUrl: true,
              discountType: true,
              discountValue: true,
            },
          },
        },
        orderBy: [{ area: "asc" }, { name: "asc" }],
      }),
      prisma.favorite.findMany({
        where: { userId },
        select: {
          restaurantId: true,
          restaurant: {
            select: {
              cuisine: true,
              area: true,
            },
          },
        },
      }),
      prisma.visitHistory.findMany({
        where: {
          userId,
          visitedAt: { gte: thirtyDaysAgo },
        },
        orderBy: { visitedAt: "desc" },
        take: 50,
        select: {
          restaurantId: true,
          visitedAt: true,
          restaurant: {
            select: {
              id: true,
              name: true,
              area: true,
              cuisine: true,
              offer: {
                select: {
                  offerText: true,
                  isActive: true,
                  photoUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.coupon.findMany({
        where: { userId },
        select: {
          restaurant: {
            select: {
              cuisine: true,
              area: true,
            },
          },
        },
      }),
      prisma.area.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          nameEn: true,
          nameBn: true,
        },
      }),
    ]);
    const parallelQueryTime = Date.now() - queryStart;

    // Log timing for monitoring
    console.log(`[restaurants-page] Auth: ${authTime}ms, Queries (parallel): ${parallelQueryTime}ms, Total: ${Date.now() - apiStart}ms`);

    const restaurants = allRestaurants
      .filter((r) => r.offer && r.offer.isActive)
      .map((r) => ({
        id: r.id,
        name: r.name,
        area: r.area,
        cuisine: r.cuisine,
        description: r.description,
        isActive: r.isActive,
        offPeakBoost: r.offPeakBoost,
        createdAt: r.createdAt,
        offer: r.offer
          ? {
              id: r.offer.id,
              offerText: r.offer.offerText,
              photoUrl: r.offer.photoUrl,
              discountType: r.offer.discountType,
              discountValue: r.offer.discountValue,
            }
          : null,
      }));

    if (offPeak) {
      restaurants.sort((a, b) => {
        if (a.offPeakBoost && !b.offPeakBoost) return -1;
        if (!a.offPeakBoost && b.offPeakBoost) return 1;
        return 0;
      });
    }

    const groupedByArea: Record<string, typeof restaurants> = {};
    for (const restaurant of restaurants) {
      if (!groupedByArea[restaurant.area]) {
        groupedByArea[restaurant.area] = [];
      }
      groupedByArea[restaurant.area].push(restaurant);
    }

    const favoriteIds = new Set(favorites.map((f) => f.restaurantId));
    const favoritesData = favorites.map((f) => ({
      restaurantId: f.restaurantId,
    }));

    const seen = new Set<string>();
    const recentlyVisited = visits
      .filter((visit) => {
        if (seen.has(visit.restaurantId)) return false;
        seen.add(visit.restaurantId);
        return true;
      })
      .slice(0, 20)
      .map((visit) => ({
        id: visit.restaurant.id,
        name: visit.restaurant.name,
        area: visit.restaurant.area,
        cuisine: visit.restaurant.cuisine,
        offer: visit.restaurant.offer
          ? {
              offerText: visit.restaurant.offer.offerText,
              isActive: visit.restaurant.offer.isActive,
              photoUrl: visit.restaurant.offer.photoUrl,
            }
          : null,
        visitedAt: visit.visitedAt,
      }));

    const favoriteCuisines = favorites
      .map((f) => f.restaurant.cuisine)
      .filter(Boolean) as string[];
    const favoriteAreas = favorites.map((f) => f.restaurant.area);
    const visitedIds = new Set(visits.map((v) => v.restaurantId));
    const visitedCuisines = visits
      .map((v) => v.restaurant.cuisine)
      .filter(Boolean) as string[];
    const visitedAreas = visits.map((v) => v.restaurant.area);
    const couponCuisines = coupons
      .map((c) => c.restaurant.cuisine)
      .filter(Boolean) as string[];
    const couponAreas = coupons.map((c) => c.restaurant.area);

    const allCuisines = [...favoriteCuisines, ...visitedCuisines, ...couponCuisines];
    const allAreas = [...favoriteAreas, ...visitedAreas, ...couponAreas];

    const cuisineCount: Record<string, number> = {};
    allCuisines.forEach((c) => {
      cuisineCount[c] = (cuisineCount[c] || 0) + 1;
    });

    const areaCount: Record<string, number> = {};
    allAreas.forEach((a) => {
      areaCount[a] = (areaCount[a] || 0) + 1;
    });

    const scoredRestaurants = allRestaurants
      .filter((r) => r.offer && r.offer.isActive)
      .map((restaurant) => {
        let score = 0;

        if (restaurant.cuisine && cuisineCount[restaurant.cuisine]) {
          score += cuisineCount[restaurant.cuisine] * 10;
        }

        if (areaCount[restaurant.area]) {
          score += areaCount[restaurant.area] * 5;
        }

        if (favoriteIds.has(restaurant.id)) {
          score += 3;
        }

        if (visitedIds.has(restaurant.id)) {
          score += 2;
        }

        const now = new Date();
        const bdHour = (now.getUTCHours() + 6) % 24;
        if (restaurant.offPeakBoost && bdHour >= 15 && bdHour < 18) {
          score += 15;
        }

        return {
          id: restaurant.id,
          name: restaurant.name,
          area: restaurant.area,
          cuisine: restaurant.cuisine,
          description: restaurant.description,
          isActive: restaurant.isActive,
          offer: restaurant.offer
            ? {
                offerText: restaurant.offer.offerText,
                isActive: restaurant.offer.isActive,
                photoUrl: restaurant.offer.photoUrl,
              }
            : null,
          score,
          isFavorite: favoriteIds.has(restaurant.id),
          recentlyVisited: visitedIds.has(restaurant.id),
        };
      });

    scoredRestaurants.sort((a, b) => b.score - a.score);

    const recommendations = scoredRestaurants.slice(0, 20);

    const topCuisines = Object.entries(cuisineCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cuisine]) => cuisine);

    const topAreas = Object.entries(areaCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area]) => area);

    return NextResponse.json({
      restaurants: {
        restaurants,
        groupedByArea,
        isOffPeakHours: offPeak,
      },
      favorites: {
        favorites: favoritesData,
      },
      visitHistory: {
        recentlyVisited,
      },
      recommendations: {
        recommendations,
        preferences: {
          topCuisines,
          topAreas,
          totalFavorites: favorites.length,
          totalVisits: visits.length,
        },
      },
      areas: {
        areas,
      },
    });
  } catch (error) {
    console.error("Get restaurants page data error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants page data" },
      { status: 500 }
    );
  }
}
