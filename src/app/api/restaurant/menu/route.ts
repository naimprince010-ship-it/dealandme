import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET - Get restaurant menu URL
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

    if (!session || session.userType !== "RESTAURANT" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.userId },
      select: { menuUrl: true },
    });

    return NextResponse.json({ menuUrl: restaurant?.menuUrl || null });
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Update menu URL (URL-based for MVP - can be Google Drive, Dropbox, etc.)
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

    if (!session || session.userType !== "RESTAURANT" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { menuUrl } = await request.json();

    // Validate URL format if provided
    if (menuUrl && menuUrl.trim()) {
      try {
        new URL(menuUrl);
      } catch {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
      }
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: session.userId },
      data: { menuUrl: menuUrl?.trim() || null },
      select: { menuUrl: true },
    });

    return NextResponse.json({ menuUrl: restaurant.menuUrl });
  } catch (error) {
    console.error("Error updating menu:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove menu URL
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
    });

    if (!session || session.userType !== "RESTAURANT" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.restaurant.update({
      where: { id: session.userId },
      data: { menuUrl: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing menu:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
