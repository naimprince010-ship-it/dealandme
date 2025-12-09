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

    return NextResponse.json({ offer });
  } catch (error) {
    console.error("Error updating offer:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}
