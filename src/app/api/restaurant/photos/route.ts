import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET - Get restaurant photos (for restaurant owner)
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

    const photos = await prisma.restaurantPhoto.findMany({
      where: { restaurantId: session.userId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ photos });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add a new photo (URL-based for MVP)
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

    const { url, caption, isPrimary } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "Photo URL is required" }, { status: 400 });
    }

    // Get current max sort order
    const maxSortOrder = await prisma.restaurantPhoto.aggregate({
      where: { restaurantId: session.userId },
      _max: { sortOrder: true },
    });

    // If setting as primary, unset other primary photos
    if (isPrimary) {
      await prisma.restaurantPhoto.updateMany({
        where: { restaurantId: session.userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const photo = await prisma.restaurantPhoto.create({
      data: {
        restaurantId: session.userId,
        url,
        caption: caption || null,
        isPrimary: isPrimary || false,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json({ photo });
  } catch (error) {
    console.error("Error adding photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a photo
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

    if (!session || session.userType !== "RESTAURANT" || session.expiresAt < new Date()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { photoId } = await request.json();

    if (!photoId) {
      return NextResponse.json({ error: "Photo ID is required" }, { status: 400 });
    }

    // Verify photo belongs to this restaurant
    const photo = await prisma.restaurantPhoto.findFirst({
      where: { id: photoId, restaurantId: session.userId },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    await prisma.restaurantPhoto.delete({
      where: { id: photoId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update photo (set primary, update caption, reorder)
export async function PATCH(request: NextRequest) {
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

    const { photoId, caption, isPrimary, sortOrder } = await request.json();

    if (!photoId) {
      return NextResponse.json({ error: "Photo ID is required" }, { status: 400 });
    }

    // Verify photo belongs to this restaurant
    const photo = await prisma.restaurantPhoto.findFirst({
      where: { id: photoId, restaurantId: session.userId },
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // If setting as primary, unset other primary photos
    if (isPrimary) {
      await prisma.restaurantPhoto.updateMany({
        where: { restaurantId: session.userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const updatedPhoto = await prisma.restaurantPhoto.update({
      where: { id: photoId },
      data: {
        ...(caption !== undefined && { caption }),
        ...(isPrimary !== undefined && { isPrimary }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ photo: updatedPhoto });
  } catch (error) {
    console.error("Error updating photo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
