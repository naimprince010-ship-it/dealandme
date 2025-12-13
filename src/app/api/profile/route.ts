import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Unauthorized: Customer login required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        photoUrl: true,
        referralCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json(
        { error: "Unauthorized: Customer login required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    const updateData: { name?: string; email?: string } = {};

    if (name !== undefined) {
      if (name && name.length > 100) {
        return NextResponse.json(
          { error: "Name must be less than 100 characters" },
          { status: 400 }
        );
      }
      updateData.name = name || null;
    }

    if (email !== undefined) {
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
      updateData.email = email || null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        photoUrl: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
