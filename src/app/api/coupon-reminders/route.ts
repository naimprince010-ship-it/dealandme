import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint is called by a cron job to send expiry reminders
// For MVP, we'll check for coupons expiring in 30 minutes and mark them for notification

export async function GET() {
  try {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
    const thirtyFiveMinutesFromNow = new Date(now.getTime() + 35 * 60 * 1000);

    // Find coupons expiring in approximately 30 minutes (30-35 min window)
    const expiringCoupons = await prisma.coupon.findMany({
      where: {
        status: "UNUSED",
        expiresAt: {
          gte: thirtyMinutesFromNow,
          lt: thirtyFiveMinutesFromNow,
        },
      },
      include: {
        user: {
          include: {
            pushSubscriptions: true,
          },
        },
        restaurant: true,
        offer: true,
      },
    });

    const notifications: Array<{
      userId: string;
      couponCode: string;
      restaurantName: string;
      offerText: string;
      expiresAt: Date;
      subscriptions: Array<{
        endpoint: string;
        p256dh: string;
        auth: string;
      }>;
    }> = [];

    for (const coupon of expiringCoupons) {
      if (coupon.user.pushSubscriptions.length > 0) {
        notifications.push({
          userId: coupon.userId,
          couponCode: coupon.code,
          restaurantName: coupon.restaurant.name,
          offerText: coupon.offer.offerText,
          expiresAt: coupon.expiresAt,
          subscriptions: coupon.user.pushSubscriptions.map((sub) => ({
            endpoint: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
          })),
        });
      }
    }

    // Return the notifications to be sent
    // In production, this would actually send push notifications using web-push library
    // For MVP, we return the data and the client can poll for expiring coupons
    return NextResponse.json({
      count: notifications.length,
      notifications: notifications.map((n) => ({
        userId: n.userId,
        couponCode: n.couponCode,
        restaurantName: n.restaurantName,
        expiresAt: n.expiresAt,
      })),
    });
  } catch (error) {
    console.error("Coupon reminders error:", error);
    return NextResponse.json(
      { error: "Failed to get coupon reminders" },
      { status: 500 }
    );
  }
}
