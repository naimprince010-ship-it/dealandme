import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

// GET: Get all restaurants with their category membership status
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId is required" },
        { status: 400 }
      );
    }

    // Get all active restaurants with their offers
    const restaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        area: true,
        cuisine: true,
        offer: {
          select: {
            id: true,
            offerText: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get category-restaurant mappings for this category
    const categoryRestaurants = await prisma.homeCategoryRestaurant.findMany({
      where: { categoryId },
      select: {
        restaurantId: true,
        sortOrder: true,
      },
    });

    // Create a map for quick lookup
    const mappingMap = new Map(
      categoryRestaurants.map((cr) => [cr.restaurantId, cr.sortOrder])
    );

    // Combine data
    const restaurantsWithStatus = restaurants.map((r) => ({
      ...r,
      inCategory: mappingMap.has(r.id),
      sortOrder: mappingMap.get(r.id) ?? 0,
    }));

    // Sort: in-category first (by sortOrder), then others alphabetically
    restaurantsWithStatus.sort((a, b) => {
      if (a.inCategory && !b.inCategory) return -1;
      if (!a.inCategory && b.inCategory) return 1;
      if (a.inCategory && b.inCategory) return a.sortOrder - b.sortOrder;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ restaurants: restaurantsWithStatus });
  } catch (error) {
    console.error("Error fetching category restaurants:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

// PUT: Add or remove a restaurant from a category
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { categoryId, restaurantId, inCategory, sortOrder } =
      await request.json();

    if (!categoryId || !restaurantId) {
      return NextResponse.json(
        { error: "categoryId and restaurantId are required" },
        { status: 400 }
      );
    }

    if (inCategory) {
      // Add or update the mapping
      await prisma.homeCategoryRestaurant.upsert({
        where: {
          categoryId_restaurantId: {
            categoryId,
            restaurantId,
          },
        },
        update: {
          sortOrder: sortOrder ?? 0,
        },
        create: {
          categoryId,
          restaurantId,
          sortOrder: sortOrder ?? 0,
        },
      });
    } else {
      // Remove the mapping
      await prisma.homeCategoryRestaurant.deleteMany({
        where: {
          categoryId,
          restaurantId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating category restaurant:", error);
    return NextResponse.json(
      { error: "Failed to update category restaurant" },
      { status: 500 }
    );
  }
}
