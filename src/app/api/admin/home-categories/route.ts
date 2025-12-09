import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.homeCategory.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching home categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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
    const { key, labelEn, labelBn, iconKey, sortOrder, isActive, isSystem } = body;

    if (!key || !labelEn || !labelBn || !iconKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const category = await prisma.homeCategory.create({
      data: {
        key,
        labelEn,
        labelBn,
        iconKey,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
        isSystem: isSystem || false,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating home category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
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
    const { id, labelEn, labelBn, iconKey, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID required" },
        { status: 400 }
      );
    }

    const category = await prisma.homeCategory.update({
      where: { id },
      data: {
        ...(labelEn && { labelEn }),
        ...(labelBn && { labelBn }),
        ...(iconKey && { iconKey }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating home category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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
        { error: "Category ID required" },
        { status: 400 }
      );
    }

    const category = await prisma.homeCategory.findUnique({
      where: { id },
    });

    if (category?.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system category" },
        { status: 400 }
      );
    }

    await prisma.homeCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting home category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
