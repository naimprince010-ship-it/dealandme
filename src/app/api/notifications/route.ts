import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET - Get user's notifications
export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's personal notifications + global notifications
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: session.userId },
          { isGlobal: true },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { error: "Failed to get notifications" },
      { status: 500 }
    );
  }
}

// POST - Create a notification (admin only or internal use)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Allow admin or internal API calls
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, title, titleBn, body, bodyBn, data, isGlobal, userId } = await request.json();

    if (!type || !title || !body) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, body" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        titleBn,
        body,
        bodyBn,
        data,
        isGlobal: isGlobal || false,
        userId: isGlobal ? null : userId,
      },
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// PATCH - Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, markAllRead } = await request.json();

    if (markAllRead) {
      // Mark all user's notifications as read
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: session.userId },
            { isGlobal: true },
          ],
          readAt: null,
        },
        data: { readAt: new Date() },
      });

      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Missing notificationId" },
        { status: 400 }
      );
    }

    // Mark single notification as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
