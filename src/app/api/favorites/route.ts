import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/auth";

// GET - Get user's favorite restaurants
export async function GET() {
  try {
    const customer = await getCustomer();
    if (!customer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: customer.id },
      include: {
        restaurant: {
          include: {
            offer: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      favorites: favorites.map((f) => ({
        id: f.id,
        restaurantId: f.restaurantId,
        restaurant: {
          id: f.restaurant.id,
          name: f.restaurant.name,
          area: f.restaurant.area,
          cuisine: f.restaurant.cuisine,
          description: f.restaurant.description,
          offer: f.restaurant.offer
            ? {
                id: f.restaurant.offer.id,
                offerText: f.restaurant.offer.offerText,
                isActive: f.restaurant.offer.isActive,
                photoUrl: f.restaurant.offer.photoUrl,
                discountType: f.restaurant.offer.discountType,
                discountValue: f.restaurant.offer.discountValue,
              }
            : null,
        },
        createdAt: f.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorites" },
      { status: 500 }
    );
  }
}

// POST - Add restaurant to favorites
export async function POST(request: Request) {
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

    // Check if already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_restaurantId: {
          userId: customer.id,
          restaurantId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already in favorites", favorite: existing },
        { status: 200 }
      );
    }

    // Create favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: customer.id,
        restaurantId,
      },
    });

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error("Add favorite error:", error);
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// DELETE - Remove restaurant from favorites
export async function DELETE(request: Request) {
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

    // Delete favorite
    await prisma.favorite.deleteMany({
      where: {
        userId: customer.id,
        restaurantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove favorite error:", error);
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
