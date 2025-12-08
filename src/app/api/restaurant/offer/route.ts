import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET - Get restaurant's current offer
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    if (session.type !== "RESTAURANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.id },
      include: {
        offer: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({
      offer: restaurant.offer
        ? {
            id: restaurant.offer.id,
            offerText: restaurant.offer.offerText,
            isActive: restaurant.offer.isActive,
            createdAt: restaurant.offer.createdAt,
            updatedAt: restaurant.offer.updatedAt,
          }
        : null,
      offPeakBoost: restaurant.offPeakBoost,
    });
  } catch (error) {
    console.error("Get offer error:", error);
    return NextResponse.json(
      { error: "Failed to fetch offer" },
      { status: 500 }
    );
  }
}

// PUT - Update offer text or toggle active status
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    if (session.type !== "RESTAURANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { offerText, isActive, offPeakBoost } = body;

    // Get restaurant with offer
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.id },
      include: { offer: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Update off-peak boost setting if provided
    if (typeof offPeakBoost === "boolean") {
      await prisma.restaurant.update({
        where: { id: session.id },
        data: { offPeakBoost },
      });
    }

    // If no offer exists, create one (if offerText provided)
    if (!restaurant.offer) {
      if (!offerText) {
        return NextResponse.json(
          { error: "Offer text required to create offer" },
          { status: 400 }
        );
      }

      const newOffer = await prisma.offer.create({
        data: {
          restaurantId: session.id,
          offerText,
          isActive: isActive !== false,
        },
      });

      return NextResponse.json({
        offer: {
          id: newOffer.id,
          offerText: newOffer.offerText,
          isActive: newOffer.isActive,
          createdAt: newOffer.createdAt,
          updatedAt: newOffer.updatedAt,
        },
        message: "Offer created successfully",
      });
    }

    // Update existing offer
    const updateData: { offerText?: string; isActive?: boolean } = {};
    if (offerText !== undefined) updateData.offerText = offerText;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedOffer = await prisma.offer.update({
      where: { id: restaurant.offer.id },
      data: updateData,
    });

    return NextResponse.json({
      offer: {
        id: updatedOffer.id,
        offerText: updatedOffer.offerText,
        isActive: updatedOffer.isActive,
        createdAt: updatedOffer.createdAt,
        updatedAt: updatedOffer.updatedAt,
      },
      message: "Offer updated successfully",
    });
  } catch (error) {
    console.error("Update offer error:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}
