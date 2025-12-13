import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin, hashPassword } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin login required" },
        { status: 401 }
      );
    }

    const restaurants = await prisma.restaurant.findMany({
      include: {
        offer: {
          select: {
            id: true,
            offerText: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error("Get restaurants error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin login required" },
        { status: 401 }
      );
    }

    const { name, area, description, username, password, coverImage, commissionRate, trialEndDate } = await request.json();

    // Validate required fields
    if (!name || !area || !username || !password) {
      return NextResponse.json(
        { error: "Name, area, username, and password are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { username },
    });

    if (existingRestaurant) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Hash password and create restaurant
    const passwordHash = await hashPassword(password);

    const restaurant = await prisma.restaurant.create({
      data: {
        name,
        area,
        description: description || null,
        coverImage: coverImage || null,
        username,
        passwordHash,
        isActive: true,
        commissionRate: commissionRate ?? 10,
        trialEndDate: trialEndDate ? new Date(trialEndDate) : null,
      },
    });

    return NextResponse.json({
      message: "Restaurant created successfully",
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        area: restaurant.area,
        description: restaurant.description,
        coverImage: restaurant.coverImage,
        username: restaurant.username,
        isActive: restaurant.isActive,
        createdAt: restaurant.createdAt,
      },
    });
  } catch (error) {
    console.error("Create restaurant error:", error);
    return NextResponse.json(
      { error: "Failed to create restaurant" },
      { status: 500 }
    );
  }
}
