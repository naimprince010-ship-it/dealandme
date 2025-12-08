import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET - Get user's push subscription status
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.userType !== "CUSTOMER" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.pushSubscription.findFirst({
      where: { userId: session.userId },
    });

    return NextResponse.json({
      subscribed: !!subscription,
      subscriptionId: subscription?.id || null,
    });
  } catch (error) {
    console.error("Get push subscription error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}

// POST - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.userType !== "CUSTOMER" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint, keys } = await request.json();

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existing) {
      // Update existing subscription
      await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          userId: session.userId,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
    } else {
      // Create new subscription
      await prisma.pushSubscription.create({
        data: {
          userId: session.userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe push error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.userType !== "CUSTOMER" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (endpoint) {
      // Delete specific subscription
      await prisma.pushSubscription.deleteMany({
        where: {
          userId: session.userId,
          endpoint,
        },
      });
    } else {
      // Delete all subscriptions for user
      await prisma.pushSubscription.deleteMany({
        where: { userId: session.userId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsubscribe push error:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
