import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    let user = null;

    switch (session.userType) {
      case "CUSTOMER":
        const customer = await prisma.user.findUnique({
          where: { id: session.userId },
        });
        if (customer) {
          user = {
            id: customer.id,
            phone: customer.phone,
            name: customer.name,
            email: customer.email,
            photoUrl: customer.photoUrl,
            type: "CUSTOMER",
          };
        }
        break;

      case "RESTAURANT":
        const restaurant = await prisma.restaurant.findUnique({
          where: { id: session.userId },
        });
        if (restaurant) {
          user = {
            id: restaurant.id,
            name: restaurant.name,
            area: restaurant.area,
            type: "RESTAURANT",
          };
        }
        break;

      case "ADMIN":
        const admin = await prisma.admin.findUnique({
          where: { id: session.userId },
        });
        if (admin) {
          user = {
            id: admin.id,
            username: admin.username,
            type: "ADMIN",
          };
        }
        break;
    }

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Failed to check authentication" },
      { status: 500 }
    );
  }
}
