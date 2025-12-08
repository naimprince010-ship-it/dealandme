import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { formatOfferText, isOffPeakHours } from "@/lib/offer";

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
            discountType: restaurant.offer.discountType,
            discountValue: restaurant.offer.discountValue,
            maxDiscountAmount: restaurant.offer.maxDiscountAmount,
            title: restaurant.offer.title,
            description: restaurant.offer.description,
            terms: restaurant.offer.terms,
            photoUrl: restaurant.offer.photoUrl,
            createdAt: restaurant.offer.createdAt,
            updatedAt: restaurant.offer.updatedAt,
          }
        : null,
      offPeakBoost: restaurant.offPeakBoost,
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
    if (!restaurant.offer) {
      if (!finalOfferText) {
        return NextResponse.json(
          { error: "Offer details required to create offer" },
          { status: 400 }
        );
      }

      const newOffer = await prisma.offer.create({
        data: {
          restaurantId: session.id,
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
      where: { id: restaurant.offer.id },
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
