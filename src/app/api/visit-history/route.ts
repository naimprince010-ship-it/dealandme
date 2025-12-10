import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/auth";

// GET - Get user's recently visited restaurants
export async function GET() {
  try {
    const customer = await getCustomer();
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get recent visits (last 20, unique restaurants)
    const visits = await prisma.visitHistory.findMany({
      where: { userId: customer.id },
      orderBy: { visitedAt: "desc" },
      take: 50,
      include: {
        restaurant: {
          include: {
            offer: true,
          },
        },
      },
    });

    // Deduplicate by restaurant, keeping most recent visit
    const seen = new Set<string>();
    const uniqueVisits = visits.filter((visit) => {
      if (seen.has(visit.restaurantId)) return false;
      seen.add(visit.restaurantId);
      return true;
    }).slice(0, 20);

    const recentlyVisited = uniqueVisits.map((visit) => ({
      id: visit.restaurant.id,
      name: visit.restaurant.name,
      area: visit.restaurant.area,
      cuisine: visit.restaurant.cuisine,
      description: visit.restaurant.description,
      isActive: visit.restaurant.isActive,
      offer: visit.restaurant.offer
        ? {
            offerText: visit.restaurant.offer.offerText,
            isActive: visit.restaurant.offer.isActive,
          }
        : null,
      visitedAt: visit.visitedAt,
    }));

    return NextResponse.json({ recentlyVisited });
  } catch (error) {
    console.error("Get visit history error:", error);
    return NextResponse.json(
      { error: "Failed to get visit history" },
      { status: 500 }
    );
  }
}

// POST - Record a restaurant visit
export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomer();
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { restaurantId } = await request.json();

    if (!restaurantId) {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Record the visit
    await prisma.visitHistory.create({
      data: {
        userId: customer.id,
        restaurantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Record visit error:", error);
    return NextResponse.json(
      { error: "Failed to record visit" },
      { status: 500 }
    );
  }
}
