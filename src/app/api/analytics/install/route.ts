import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { installId, appType } = body;

    if (!installId || !appType) {
      return NextResponse.json(
        { error: "installId and appType are required" },
        { status: 400 }
      );
    }

    if (!Object.values(AppType).includes(appType)) {
      return NextResponse.json(
        { error: "Invalid appType. Must be CUSTOMER or RESTAURANT" },
        { status: 400 }
      );
    }

    const session = await getSession();
    const userId = session?.userId || null;
    const userAgent = request.headers.get("user-agent") || null;

    await prisma.appInstall.upsert({
      where: { installId },
      update: {
        lastSeenAt: new Date(),
        userId: userId || undefined,
      },
      create: {
        installId,
        appType: appType as AppType,
        userId,
        userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Install tracking error:", error);
    return NextResponse.json(
      { error: "Failed to track install" },
      { status: 500 }
    );
  }
}
