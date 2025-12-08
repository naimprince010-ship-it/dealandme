import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomer, generateCouponCode } from "@/lib/auth";

const COUPON_EXPIRY_HOURS = 3;

export async function POST(request: NextRequest) {
  try {
    const customer = await getCustomer();
    if (!customer) {
      return NextResponse.json(
        { error: "Unauthorized: Please login first" },
        { status: 401 }
      );
    }

    const { restaurantId } = await request.json();

    if (!restaurantId || typeof restaurantId !== "string") {
      return NextResponse.json(
        { error: "Restaurant ID is required" },
        { status: 400 }
      );
    }

    // Check if restaurant exists and is active
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        offer: true,
      },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        { error: "Restaurant not found or not available" },
        { status: 404 }
      );
    }

    if (!restaurant.offer || !restaurant.offer.isActive) {
      return NextResponse.json(
        { error: "This offer is no longer available" },
        { status: 400 }
      );
    }

    // Check for existing UNUSED coupon that hasn't expired
    const existingCoupon = await prisma.coupon.findFirst({
      where: {
        userId: customer.id,
        restaurantId: restaurantId,
        status: "UNUSED",
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        restaurant: {
          select: {
            name: true,
            area: true,
          },
        },
        offer: {
          select: {
            offerText: true,
          },
        },
      },
    });

    if (existingCoupon) {
      // Return existing coupon instead of creating new one
      return NextResponse.json({
        coupon: existingCoupon,
        isExisting: true,
        message: "You already have an active coupon for this restaurant",
      });
    }

    // Generate new coupon
    let code = generateCouponCode();
    let attempts = 0;
    const maxAttempts = 3;

    // Ensure unique code
    while (attempts < maxAttempts) {
      const existingCode = await prisma.coupon.findUnique({
        where: { code },
      });
      if (!existingCode) break;
      code = generateCouponCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "Failed to generate unique coupon code. Please try again." },
        { status: 500 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + COUPON_EXPIRY_HOURS);

    const newCoupon = await prisma.coupon.create({
      data: {
        code,
        userId: customer.id,
        restaurantId: restaurantId,
        offerId: restaurant.offer.id,
        status: "UNUSED",
        expiresAt,
      },
      include: {
        restaurant: {
          select: {
            name: true,
            area: true,
          },
        },
        offer: {
          select: {
            offerText: true,
          },
        },
      },
    });

    return NextResponse.json({
      coupon: newCoupon,
      isExisting: false,
      message: "Coupon generated successfully",
    });
  } catch (error) {
    console.error("Generate coupon error:", error);
    return NextResponse.json(
      { error: "Failed to generate coupon" },
      { status: 500 }
    );
  }
}
