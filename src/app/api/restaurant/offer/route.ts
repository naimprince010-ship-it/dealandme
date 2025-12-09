import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatOfferText, isOffPeakHours } from "@/lib/offer";
import { getRestaurant } from "@/lib/auth";

// GET - Get restaurant's current offer
export async function GET() {
  try {
    const restaurant = await getRestaurant();

    if (!restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurantWithOffer = await prisma.restaurant.findUnique({
      where: { id: restaurant.id },
      include: {
        offer: true,
      },
    });

    if (!restaurantWithOffer) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({
      offer: restaurantWithOffer.offer
        ? {
            id: restaurantWithOffer.offer.id,
            offerText: restaurantWithOffer.offer.offerText,
            isActive: restaurantWithOffer.offer.isActive,
            discountType: restaurantWithOffer.offer.discountType,
            discountValue: restaurantWithOffer.offer.discountValue,
            maxDiscountAmount: restaurantWithOffer.offer.maxDiscountAmount,
            title: restaurantWithOffer.offer.title,
            description: restaurantWithOffer.offer.description,
            terms: restaurantWithOffer.offer.terms,
            photoUrl: restaurantWithOffer.offer.photoUrl,
            createdAt: restaurantWithOffer.offer.createdAt,
            updatedAt: restaurantWithOffer.offer.updatedAt,
          }
        : null,
      offPeakBoost: restaurantWithOffer.offPeakBoost,
      isOffPeakNow: isOffPeakHours(),
    });
  } catch (error) {
    console.error("Get offer error:", error);
    return NextResponse.json(
      { error: "Failed to fetch offer" },
      { status: 500 }
    );
  }
}

// PUT - Update offer with structured fields
export async function PUT(request: NextRequest) {
  try {
    const restaurant = await getRestaurant();

    if (!restaurant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      offerText,
      isActive,
      offPeakBoost,
      discountType,
      discountValue,
      maxDiscountAmount,
      title,
      description,
      terms,
      photoUrl,
    } = body;

    // Validate discount fields
    if (discountType && !["PERCENTAGE", "FLAT"].includes(discountType)) {
      return NextResponse.json(
        { error: "Invalid discount type. Must be PERCENTAGE or FLAT" },
        { status: 400 }
      );
    }

    if (discountValue !== undefined && discountValue !== null && discountValue <= 0) {
      return NextResponse.json(
        { error: "Discount value must be positive" },
        { status: 400 }
      );
    }

    if (maxDiscountAmount !== undefined && maxDiscountAmount !== null && maxDiscountAmount < 0) {
      return NextResponse.json(
        { error: "Max discount amount cannot be negative" },
        { status: 400 }
      );
    }

    // Get restaurant with offer
    const restaurantWithOffer = await prisma.restaurant.findUnique({
      where: { id: restaurant.id },
      include: { offer: true },
    });

    if (!restaurantWithOffer) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Update off-peak boost setting if provided
    if (typeof offPeakBoost === "boolean") {
      await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: { offPeakBoost },
      });
    }

    // Generate offerText from structured fields if provided
    const generatedOfferText = formatOfferText({
      discountType,
      discountValue,
      maxDiscountAmount,
      title,
    });

    // Use generated text or provided offerText or existing
    const finalOfferText = generatedOfferText || offerText || title || "";

    // If no offer exists, create one
    if (!restaurantWithOffer.offer) {
      if (!finalOfferText) {
        return NextResponse.json(
          { error: "Offer details required to create offer" },
          { status: 400 }
        );
      }

      const newOffer = await prisma.offer.create({
        data: {
          restaurantId: restaurant.id,
          offerText: finalOfferText,
          isActive: isActive !== false,
          discountType: discountType || null,
          discountValue: discountValue || null,
          maxDiscountAmount: maxDiscountAmount || null,
          title: title || null,
          description: description || null,
          terms: terms || null,
          photoUrl: photoUrl || null,
        },
      });

      return NextResponse.json({
        offer: {
          id: newOffer.id,
          offerText: newOffer.offerText,
          isActive: newOffer.isActive,
          discountType: newOffer.discountType,
          discountValue: newOffer.discountValue,
          maxDiscountAmount: newOffer.maxDiscountAmount,
          title: newOffer.title,
          description: newOffer.description,
          terms: newOffer.terms,
          photoUrl: newOffer.photoUrl,
          createdAt: newOffer.createdAt,
          updatedAt: newOffer.updatedAt,
        },
        message: "Offer created successfully",
      });
    }

    // Update existing offer
    interface OfferUpdateData {
      offerText?: string;
      isActive?: boolean;
      discountType?: "PERCENTAGE" | "FLAT" | null;
      discountValue?: number | null;
      maxDiscountAmount?: number | null;
      title?: string | null;
      description?: string | null;
      terms?: string | null;
      photoUrl?: string | null;
    }

    const updateData: OfferUpdateData = {};
    
    // Update offerText if we have new structured data or explicit offerText
    if (generatedOfferText) {
      updateData.offerText = generatedOfferText;
    } else if (offerText !== undefined) {
      updateData.offerText = offerText;
    }
    
    if (isActive !== undefined) updateData.isActive = isActive;
    if (discountType !== undefined) updateData.discountType = discountType || null;
    if (discountValue !== undefined) updateData.discountValue = discountValue || null;
    if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount || null;
    if (title !== undefined) updateData.title = title || null;
    if (description !== undefined) updateData.description = description || null;
    if (terms !== undefined) updateData.terms = terms || null;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl || null;

    const updatedOffer = await prisma.offer.update({
      where: { id: restaurantWithOffer.offer.id },
      data: updateData,
    });

    return NextResponse.json({
      offer: {
        id: updatedOffer.id,
        offerText: updatedOffer.offerText,
        isActive: updatedOffer.isActive,
        discountType: updatedOffer.discountType,
        discountValue: updatedOffer.discountValue,
        maxDiscountAmount: updatedOffer.maxDiscountAmount,
        title: updatedOffer.title,
        description: updatedOffer.description,
        terms: updatedOffer.terms,
        photoUrl: updatedOffer.photoUrl,
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
