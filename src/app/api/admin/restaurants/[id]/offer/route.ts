import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin login required" },
        { status: 401 }
      );
    }

    const { id: restaurantId } = await params;
    const { offerText, isActive } = await request.json();

    // Check if restaurant exists
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { offer: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Validate offer text if provided
    if (offerText !== undefined && (!offerText || offerText.trim() === "")) {
      return NextResponse.json(
        { error: "Offer text cannot be empty" },
        { status: 400 }
      );
    }

    let offer;

    if (restaurant.offer) {
      // Update existing offer
      const updateData: { offerText?: string; isActive?: boolean } = {};
      if (offerText !== undefined) updateData.offerText = offerText;
      if (isActive !== undefined) updateData.isActive = isActive;

      offer = await prisma.offer.update({
        where: { id: restaurant.offer.id },
        data: updateData,
      });
    } else {
      // Create new offer
      if (!offerText) {
        return NextResponse.json(
          { error: "Offer text is required to create a new offer" },
          { status: 400 }
        );
      }

      offer = await prisma.offer.create({
        data: {
          restaurantId,
          offerText,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    }

    return NextResponse.json({
      message: restaurant.offer ? "Offer updated successfully" : "Offer created successfully",
      offer,
    });
  } catch (error) {
    console.error("Update offer error:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}
