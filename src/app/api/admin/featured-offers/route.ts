import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const offers = await prisma.offer.findMany({
      where: { isActive: true },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            area: true,
            cuisine: true,
          },
        },
      },
      orderBy: [
        { isFeatured: "desc" },
        { featuredSortOrder: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, isFeatured, featuredSortOrder } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Offer ID required" },
        { status: 400 }
      );
    }

        // Get current offer state to check if it's being newly featured
        const currentOffer = await prisma.offer.findUnique({
          where: { id },
          select: { isFeatured: true },
        });

        const offer = await prisma.offer.update({
          where: { id },
          data: {
            isFeatured: isFeatured ?? false,
            featuredSortOrder: featuredSortOrder ?? null,
          },
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                area: true,
              },
            },
          },
        });

        // Create a global notification if offer is newly featured
        if (isFeatured && !currentOffer?.isFeatured) {
          await prisma.notification.create({
            data: {
              type: "NEW_OFFER",
              title: `New Deal at ${offer.restaurant.name}!`,
              titleBn: `${offer.restaurant.name} এ নতুন অফার!`,
              body: offer.offerText || `Check out the latest offer at ${offer.restaurant.name}`,
              bodyBn: offer.offerText || `${offer.restaurant.name} এর নতুন অফার দেখুন`,
              data: {
                restaurantId: offer.restaurant.id,
                offerId: offer.id,
              },
              isGlobal: true,
            },
          });
        }

        return NextResponse.json({ offer });
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}
