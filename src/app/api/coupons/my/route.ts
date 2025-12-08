import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/auth";

export async function GET() {
  try {
    const customer = await getCustomer();
    if (!customer) {
      return NextResponse.json(
        { error: "Unauthorized: Please login first" },
        { status: 401 }
      );
    }

    const coupons = await prisma.coupon.findMany({
      where: {
        userId: customer.id,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    // Process coupons to mark expired ones
    const now = new Date();
    const processedCoupons = coupons.map((coupon) => {
      // If status is UNUSED but expired, treat as EXPIRED
      const effectiveStatus =
        coupon.status === "UNUSED" && coupon.expiresAt < now
          ? "EXPIRED"
          : coupon.status;

      return {
        ...coupon,
        effectiveStatus,
      };
    });

    return NextResponse.json({ coupons: processedCoupons });
  } catch (error) {
    console.error("Get my coupons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}
