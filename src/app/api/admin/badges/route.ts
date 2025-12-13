import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { BadgeCriteriaType } from "@prisma/client";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.userType !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const badges = await prisma.badge.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ badges });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
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
    const { key, nameEn, nameBn, description, icon, criteriaType, threshold, sortOrder, isActive } = body;

    if (!key || !nameEn || !nameBn || !icon || !criteriaType || threshold === undefined) {
      return NextResponse.json(
        { error: "Key, names, icon, criteria type, and threshold are required" },
        { status: 400 }
      );
    }

    if (!Object.values(BadgeCriteriaType).includes(criteriaType)) {
      return NextResponse.json(
        { error: "Invalid criteria type" },
        { status: 400 }
      );
    }

    const existingBadge = await prisma.badge.findUnique({
      where: { key },
    });

    if (existingBadge) {
      return NextResponse.json(
        { error: "Badge with this key already exists" },
        { status: 400 }
      );
    }

    const badge = await prisma.badge.create({
      data: {
        key,
        nameEn,
        nameBn,
        description: description || null,
        icon,
        criteriaType: criteriaType as BadgeCriteriaType,
        threshold,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ badge }, { status: 201 });
  } catch (error) {
    console.error("Error creating badge:", error);
    return NextResponse.json(
      { error: "Failed to create badge" },
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
    const { id, key, nameEn, nameBn, description, icon, criteriaType, threshold, sortOrder, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Badge ID required" },
        { status: 400 }
      );
    }

    if (key) {
      const existingBadge = await prisma.badge.findFirst({
        where: { key, NOT: { id } },
      });

      if (existingBadge) {
        return NextResponse.json(
          { error: "Badge with this key already exists" },
          { status: 400 }
        );
      }
    }

    if (criteriaType && !Object.values(BadgeCriteriaType).includes(criteriaType)) {
      return NextResponse.json(
        { error: "Invalid criteria type" },
        { status: 400 }
      );
    }

    const badge = await prisma.badge.update({
      where: { id },
      data: {
        ...(key && { key }),
        ...(nameEn && { nameEn }),
        ...(nameBn && { nameBn }),
        ...(description !== undefined && { description: description || null }),
        ...(icon && { icon }),
        ...(criteriaType && { criteriaType: criteriaType as BadgeCriteriaType }),
        ...(threshold !== undefined && { threshold }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ badge });
  } catch (error) {
    console.error("Error updating badge:", error);
    return NextResponse.json(
      { error: "Failed to update badge" },
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
        { error: "Badge ID required" },
        { status: 400 }
      );
    }

    await prisma.badge.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting badge:", error);
    return NextResponse.json(
      { error: "Failed to delete badge" },
      { status: 500 }
    );
  }
}
