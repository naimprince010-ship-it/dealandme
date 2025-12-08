import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRestaurant } from "@/lib/auth";

type ValidationResult =
  | "REDEEMED"
  | "NOT_FOUND"
  | "WRONG_RESTAURANT"
  | "EXPIRED"
  | "ALREADY_USED";

export async function POST(request: NextRequest) {
  try {
    const restaurant = await getRestaurant();
    if (!restaurant) {
      return NextResponse.json(
        { error: "Unauthorized: Restaurant login required" },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const trimmedCode = code.trim().toUpperCase();

    // First, look up the coupon to provide specific error messages
    const coupon = await prisma.coupon.findUnique({
      where: { code: trimmedCode },
      include: {
        user: {
          select: {
            phone: true,
          },
        },
        offer: {
          select: {
            offerText: true,
          },
        },
      },
    });

    // Check if coupon exists
    if (!coupon) {
      return NextResponse.json({
        result: "NOT_FOUND" as ValidationResult,
        message: "Coupon not found. Please check the code and try again.",
      });
    }

    // Check if coupon belongs to this restaurant
    if (coupon.restaurantId !== restaurant.id) {
      return NextResponse.json({
        result: "WRONG_RESTAURANT" as ValidationResult,
        message: "This coupon is for a different restaurant.",
      });
    }

    // Check if coupon is expired (even if status is still UNUSED)
    const now = new Date();
    if (coupon.expiresAt < now && coupon.status === "UNUSED") {
      // Update status to EXPIRED
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { status: "EXPIRED" },
      });

      return NextResponse.json({
        result: "EXPIRED" as ValidationResult,
        message: "This coupon has expired.",
      });
    }

    // Check if already used
    if (coupon.status === "USED") {
      return NextResponse.json({
        result: "ALREADY_USED" as ValidationResult,
        message: "This coupon has already been redeemed.",
        coupon: {
          code: coupon.code,
          redeemedAt: coupon.redeemedAt,
        },
      });
    }

    // Check if already expired (status is EXPIRED)
    if (coupon.status === "EXPIRED") {
      return NextResponse.json({
        result: "EXPIRED" as ValidationResult,
        message: "This coupon has expired.",
      });
    }

    // Attempt atomic redemption
    // This ensures only one request can successfully redeem the coupon
    // even if multiple requests come in simultaneously
    const redeemedCoupon = await prisma.coupon.updateMany({
      where: {
        code: trimmedCode,
        restaurantId: restaurant.id,
        status: "UNUSED",
        expiresAt: {
          gt: now,
        },
      },
      data: {
        status: "USED",
        redeemedAt: now,
      },
    });

    // If no rows were updated, the coupon was already redeemed by another request
    // or the conditions changed between our check and the update
    if (redeemedCoupon.count === 0) {
      // Re-fetch to get the current state
      const currentCoupon = await prisma.coupon.findUnique({
        where: { code: trimmedCode },
      });

      if (currentCoupon?.status === "USED") {
        return NextResponse.json({
          result: "ALREADY_USED" as ValidationResult,
          message: "This coupon was just redeemed by another request.",
        });
      }

      if (currentCoupon && currentCoupon.expiresAt < now) {
        return NextResponse.json({
          result: "EXPIRED" as ValidationResult,
          message: "This coupon has expired.",
        });
      }

      return NextResponse.json({
        result: "NOT_FOUND" as ValidationResult,
        message: "Unable to redeem coupon. Please try again.",
      });
    }

    // Successfully redeemed!
    return NextResponse.json({
      result: "REDEEMED" as ValidationResult,
      message: "Coupon successfully redeemed!",
      coupon: {
        code: coupon.code,
        customerPhone: coupon.user.phone,
        offerText: coupon.offer.offerText,
        redeemedAt: now,
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
