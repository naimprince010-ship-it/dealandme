import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        offer: {
          select: {
            id: true,
            offerText: true,
            isActive: true,
          },
        },
        photos: {
          orderBy: [
            { isPrimary: "desc" },
            { sortOrder: "asc" },
          ],
          select: {
            id: true,
            url: true,
            caption: true,
            isPrimary: true,
          },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    if (!restaurant.isActive) {
      return NextResponse.json(
        { error: "Restaurant is not available" },
        { status: 404 }
      );
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error("Get restaurant error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant" },
      { status: 500 }
    );
  }
}
