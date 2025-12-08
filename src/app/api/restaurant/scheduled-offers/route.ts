import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET - Get all scheduled offers for the restaurant
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

    const scheduledOffers = await prisma.scheduledOffer.findMany({
      where: { restaurantId: session.userId },
      orderBy: { startTime: "asc" },
    });

    // Also get the current active scheduled offer (if any)
    const now = new Date();
    const activeScheduledOffer = await prisma.scheduledOffer.findFirst({
      where: {
        restaurantId: session.userId,
        isActive: true,
        startTime: { lte: now },
        endTime: { gte: now },
      },
    });

    return NextResponse.json({ 
      scheduledOffers,
      activeScheduledOffer,
    });
  } catch (error) {
    console.error("Error fetching scheduled offers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a new scheduled offer
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

    const { offerText, startTime, endTime } = await request.json();

    if (!offerText || !startTime || !endTime) {
      return NextResponse.json({ 
        error: "Offer text, start time, and end time are required" 
      }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json({ 
        error: "End time must be after start time" 
      }, { status: 400 });
    }

    if (start < new Date()) {
      return NextResponse.json({ 
        error: "Start time cannot be in the past" 
      }, { status: 400 });
    }

    // Check for overlapping scheduled offers
    const overlapping = await prisma.scheduledOffer.findFirst({
      where: {
        restaurantId: session.userId,
        isActive: true,
        OR: [
          {
            startTime: { lte: start },
            endTime: { gte: start },
          },
          {
            startTime: { lte: end },
            endTime: { gte: end },
          },
          {
            startTime: { gte: start },
            endTime: { lte: end },
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json({ 
        error: "This time slot overlaps with an existing scheduled offer" 
      }, { status: 400 });
    }

    const scheduledOffer = await prisma.scheduledOffer.create({
      data: {
        restaurantId: session.userId,
        offerText,
        startTime: start,
        endTime: end,
        isActive: true,
      },
    });

    return NextResponse.json({ scheduledOffer });
  } catch (error) {
    console.error("Error creating scheduled offer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a scheduled offer
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

    const { offerId } = await request.json();

    if (!offerId) {
      return NextResponse.json({ error: "Offer ID is required" }, { status: 400 });
    }

    // Verify offer belongs to this restaurant
    const offer = await prisma.scheduledOffer.findFirst({
      where: { id: offerId, restaurantId: session.userId },
    });

    if (!offer) {
      return NextResponse.json({ error: "Scheduled offer not found" }, { status: 404 });
    }

    await prisma.scheduledOffer.delete({
      where: { id: offerId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheduled offer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update a scheduled offer (toggle active, update times)
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

    const { offerId, offerText, startTime, endTime, isActive } = await request.json();

    if (!offerId) {
      return NextResponse.json({ error: "Offer ID is required" }, { status: 400 });
    }

    // Verify offer belongs to this restaurant
    const offer = await prisma.scheduledOffer.findFirst({
      where: { id: offerId, restaurantId: session.userId },
    });

    if (!offer) {
      return NextResponse.json({ error: "Scheduled offer not found" }, { status: 404 });
    }

    const updateData: {
      offerText?: string;
      startTime?: Date;
      endTime?: Date;
      isActive?: boolean;
    } = {};

    if (offerText !== undefined) updateData.offerText = offerText;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (startTime !== undefined) {
      updateData.startTime = new Date(startTime);
    }
    if (endTime !== undefined) {
      updateData.endTime = new Date(endTime);
    }

    // Validate times if both are being updated
    if (updateData.startTime && updateData.endTime) {
      if (updateData.startTime >= updateData.endTime) {
        return NextResponse.json({ 
          error: "End time must be after start time" 
        }, { status: 400 });
      }
    }

    const updatedOffer = await prisma.scheduledOffer.update({
      where: { id: offerId },
      data: updateData,
    });

    return NextResponse.json({ scheduledOffer: updatedOffer });
  } catch (error) {
    console.error("Error updating scheduled offer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
