import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

// GET - Get commission summary for all restaurants
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month") || getCurrentBillingMonth();

    // Get all restaurants with their commission data
    const restaurants = await prisma.restaurant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        area: true,
        commissionRate: true,
        trialEndDate: true,
      },
    });

    // Get redeemed coupons for the billing month
    const monthStart = new Date(month + "-01");
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const redeemedCoupons = await prisma.coupon.findMany({
      where: {
        status: "USED",
        redeemedAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
      select: {
        id: true,
        restaurantId: true,
        redeemedAt: true,
      },
    });

    // Get existing commissions for this month
    const existingCommissions = await prisma.commission.findMany({
      where: { billingMonth: month },
    });

    const commissionMap = new Map(
      existingCommissions.map((c) => [c.couponId, c])
    );

    // Calculate commission summary per restaurant
    const now = new Date();
    const restaurantSummary = restaurants.map((restaurant) => {
      const restaurantCoupons = redeemedCoupons.filter(
        (c) => c.restaurantId === restaurant.id
      );
      
      const totalRedeemed = restaurantCoupons.length;
      
      // Check if restaurant is in trial period
      const isInTrial = restaurant.trialEndDate && new Date(restaurant.trialEndDate) > now;
      const commissionPerCoupon = isInTrial ? 0 : restaurant.commissionRate;
      const totalCommission = totalRedeemed * commissionPerCoupon;

      // Check payment status
      const paidCoupons = restaurantCoupons.filter(
        (c) => commissionMap.get(c.id)?.isPaid
      ).length;
      const unpaidCoupons = totalRedeemed - paidCoupons;
      const unpaidAmount = unpaidCoupons * commissionPerCoupon;

      return {
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        area: restaurant.area,
        commissionRate: restaurant.commissionRate,
        isInTrial,
        trialEndDate: restaurant.trialEndDate,
        totalRedeemed,
        totalCommission,
        paidCoupons,
        unpaidCoupons,
        unpaidAmount,
      };
    });

    // Calculate totals
    const totals = {
      totalRedeemed: restaurantSummary.reduce((sum, r) => sum + r.totalRedeemed, 0),
      totalCommission: restaurantSummary.reduce((sum, r) => sum + r.totalCommission, 0),
      totalUnpaid: restaurantSummary.reduce((sum, r) => sum + r.unpaidAmount, 0),
    };

    return NextResponse.json({
      month,
      restaurants: restaurantSummary.filter((r) => r.totalRedeemed > 0),
      totals,
    });
  } catch (error) {
    console.error("Get commissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch commissions" },
      { status: 500 }
    );
  }
}

// POST - Mark commissions as paid for a restaurant
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { restaurantId, month } = body;

    if (!restaurantId || !month) {
      return NextResponse.json(
        { error: "Restaurant ID and month required" },
        { status: 400 }
      );
    }

    // Get restaurant commission rate
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { commissionRate: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // Get redeemed coupons for this restaurant in the billing month
    const monthStart = new Date(month + "-01");
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const redeemedCoupons = await prisma.coupon.findMany({
      where: {
        restaurantId,
        status: "USED",
        redeemedAt: {
          gte: monthStart,
          lt: monthEnd,
        },
      },
      select: { id: true },
    });

    // Create or update commission records
    const now = new Date();
    let created = 0;
    let updated = 0;

    for (const coupon of redeemedCoupons) {
      const existing = await prisma.commission.findFirst({
        where: { couponId: coupon.id },
      });

      if (existing) {
        if (!existing.isPaid) {
          await prisma.commission.update({
            where: { id: existing.id },
            data: { isPaid: true, paidAt: now },
          });
          updated++;
        }
      } else {
        await prisma.commission.create({
          data: {
            restaurantId,
            couponId: coupon.id,
            amount: restaurant.commissionRate,
            isPaid: true,
            paidAt: now,
            billingMonth: month,
          },
        });
        created++;
      }
    }

    return NextResponse.json({
      message: "Commissions marked as paid",
      created,
      updated,
      total: redeemedCoupons.length,
    });
  } catch (error) {
    console.error("Mark commissions paid error:", error);
    return NextResponse.json(
      { error: "Failed to mark commissions as paid" },
      { status: 500 }
    );
  }
}

function getCurrentBillingMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
