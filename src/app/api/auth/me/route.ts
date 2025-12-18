import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get debug info
    const headersList = await headers();
    const cookieStore = await cookies();
    const host = headersList.get("host") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";
    
    // Check for session cookies
    const hasCustomerCookie = !!cookieStore.get("dealbox_customer_session")?.value;
    const hasRestaurantCookie = !!cookieStore.get("dealbox_restaurant_session")?.value;
    const hasAdminCookie = !!cookieStore.get("dealbox_admin_session")?.value;
    const hasAnySessionCookie = hasCustomerCookie || hasRestaurantCookie || hasAdminCookie;
    
    // Check if debug mode is requested
    const url = new URL(request.url);
    const debugMode = url.searchParams.get("debug") === "1";

    const session = await getSession();

    // Build debug object (only included if debugMode is true)
    const debug = debugMode ? {
      host,
      userAgent: userAgent.substring(0, 100), // Truncate for readability
      hasCustomerCookie,
      hasRestaurantCookie,
      hasAdminCookie,
      hasAnySessionCookie,
      sessionFound: !!session,
      sessionUserType: session?.userType || null,
    } : undefined;

    if (!session) {
      return NextResponse.json(
        { authenticated: false, debug },
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
        { authenticated: false, debug },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user,
      debug,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { error: "Failed to check authentication" },
      { status: 500 }
    );
  }
}
