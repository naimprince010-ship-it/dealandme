import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      include: {
        offer: {
          select: {
            id: true,
            offerText: true,
            discountType: true,
            discountValue: true,
            photoUrl: true,
          },
        },
      },
      orderBy: [
        { isPopular: "desc" },
        { popularSortOrder: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
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
    const { id, isPopular, popularSortOrder, latitude, longitude } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Restaurant ID required" },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: {
        isPopular: isPopular ?? false,
        popularSortOrder: popularSortOrder ?? null,
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
      include: {
        offer: {
          select: {
            id: true,
            offerText: true,
          },
        },
      },
    });

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return NextResponse.json(
      { error: "Failed to update restaurant" },
      { status: 500 }
    );
  }
}
