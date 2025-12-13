import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin, hashPassword } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin login required" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id },
      include: {
        offer: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ restaurant });
  } catch (error) {
    console.error("Get restaurant error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin login required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, area, description, isActive, newPassword, coverImage } = body;

    // Check if restaurant exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id },
    });

    if (!existingRestaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: {
      name?: string;
      area?: string;
      description?: string | null;
      isActive?: boolean;
      passwordHash?: string;
      coverImage?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (area !== undefined) updateData.area = area;
    if (description !== undefined) updateData.description = description || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (coverImage !== undefined) updateData.coverImage = coverImage || null;

    // Handle password reset
    if (newPassword) {
      updateData.passwordHash = await hashPassword(newPassword);
    }

    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: updateData,
      include: {
        offer: true,
      },
    });

    return NextResponse.json({
      message: "Restaurant updated successfully",
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        area: restaurant.area,
        description: restaurant.description,
        coverImage: restaurant.coverImage,
        username: restaurant.username,
        isActive: restaurant.isActive,
        offer: restaurant.offer,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update restaurant error:", error);
    return NextResponse.json(
      { error: "Failed to update restaurant" },
      { status: 500 }
    );
  }
}
