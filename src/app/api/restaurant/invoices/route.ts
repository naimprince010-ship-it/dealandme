import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// GET - Get invoices for the logged-in restaurant
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    if (session.type !== "RESTAURANT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { restaurantId: session.id };
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Get restaurant payment status
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: session.id },
      select: { paymentOverdue: true },
    });

    // Calculate summary
    const totalUnpaid = invoices
      .filter((inv) => inv.status === "SENT" || inv.status === "OVERDUE")
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const overdueCount = invoices.filter((inv) => inv.status === "OVERDUE").length;

    return NextResponse.json({
      invoices,
      summary: {
        totalUnpaid,
        overdueCount,
        paymentOverdue: restaurant?.paymentOverdue || false,
      },
    });
  } catch (error) {
    console.error("Get restaurant invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}
