import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    if (session.userType === "CUSTOMER") {
      await prisma.user.update({
        where: { id: session.userId },
        data: { lastActiveAt: now },
      });
    } else if (session.userType === "RESTAURANT") {
      await prisma.restaurant.update({
        where: { id: session.userId },
        data: { lastActiveAt: now },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json(
      { error: "Failed to update activity" },
      { status: 500 }
    );
  }
}
