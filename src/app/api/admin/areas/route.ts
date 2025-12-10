import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const areas = await prisma.area.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ areas });
  } catch (error) {
    console.error("Error fetching areas:", error);
    return NextResponse.json(
      { error: "Failed to fetch areas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { nameEn, nameBn, sortOrder, isActive } = body;

    if (!nameEn || !nameBn) {
      return NextResponse.json(
        { error: "Name in English and Bangla are required" },
        { status: 400 }
      );
    }

    const existingArea = await prisma.area.findUnique({
      where: { nameEn },
    });

    if (existingArea) {
      return NextResponse.json(
        { error: "Area with this name already exists" },
        { status: 400 }
      );
    }

    const area = await prisma.area.create({
      data: {
        nameEn,
        nameBn,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ area }, { status: 201 });
  } catch (error) {
    console.error("Error creating area:", error);
    return NextResponse.json(
      { error: "Failed to create area" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, nameEn, nameBn, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Area ID required" },
        { status: 400 }
      );
    }

    if (nameEn) {
      const existingArea = await prisma.area.findFirst({
        where: { nameEn, NOT: { id } },
      });

      if (existingArea) {
        return NextResponse.json(
          { error: "Area with this name already exists" },
          { status: 400 }
        );
      }
    }

    const area = await prisma.area.update({
      where: { id },
      data: {
        ...(nameEn && { nameEn }),
        ...(nameBn && { nameBn }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ area });
  } catch (error) {
    console.error("Error updating area:", error);
    return NextResponse.json(
      { error: "Failed to update area" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Area ID required" },
        { status: 400 }
      );
    }

    await prisma.area.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting area:", error);
    return NextResponse.json(
      { error: "Failed to delete area" },
      { status: 500 }
    );
  }
}
