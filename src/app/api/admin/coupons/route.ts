import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";
import { Prisma, CouponStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin login required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");
    const phone = searchParams.get("phone");
    const status = searchParams.get("status");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");
    const dateField = searchParams.get("dateField") || "createdAt";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const now = new Date();

    // Build where clause using Prisma's generated types
    const whereClause: Prisma.CouponWhereInput = {};

    // Filter by restaurant
    if (restaurantId) {
      whereClause.restaurantId = restaurantId;
    }

    // Filter by phone (partial match)
    if (phone) {
      whereClause.user = {
        phone: {
          contains: phone,
          mode: "insensitive",
        },
      };
    }

    // Filter by status
    if (status) {
      if (status === "EXPIRED") {
        // Include both EXPIRED status and UNUSED with expired time
        whereClause.OR = [
          { status: CouponStatus.EXPIRED },
          { status: CouponStatus.UNUSED, expiresAt: { lt: now } },
        ];
      } else {
        whereClause.status = status as CouponStatus;
      }
    }

    // Date range filter
    if (fromDate || toDate) {
      const dateFilter: { gte?: Date; lte?: Date } = {};
      if (fromDate) {
        dateFilter.gte = new Date(fromDate);
      }
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.lte = endDate;
      }

      if (dateField === "redeemedAt") {
        whereClause.redeemedAt = dateFilter;
      } else {
        whereClause.createdAt = dateFilter;
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.coupon.count({ where: whereClause });

    // Get coupons with pagination
    const coupons = await prisma.coupon.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
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
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate effective status for each coupon
    const couponsWithEffectiveStatus = coupons.map((coupon) => {
      let effectiveStatus = coupon.status;
      if (coupon.status === "UNUSED" && coupon.expiresAt < now) {
        effectiveStatus = "EXPIRED";
      }
      return {
        id: coupon.id,
        code: coupon.code,
        restaurantId: coupon.restaurantId,
        restaurantName: coupon.restaurant.name,
        customerPhone: coupon.user.phone,
        offerText: coupon.offer.offerText,
        status: coupon.status,
        effectiveStatus,
        createdAt: coupon.createdAt,
        expiresAt: coupon.expiresAt,
        redeemedAt: coupon.redeemedAt,
      };
    });

    return NextResponse.json({
      coupons: couponsWithEffectiveStatus,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}
