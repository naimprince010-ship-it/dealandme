import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Check for overdue invoices and auto-block restaurants
// This endpoint can be called by a cron job (e.g., daily)
export async function POST() {
  try {
    const now = new Date();

    // Find all sent invoices that are past due date
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: "SENT",
        dueDate: {
          lt: now,
        },
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const results = [];

    for (const invoice of overdueInvoices) {
      // Mark invoice as overdue
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "OVERDUE" },
      });

      // Set payment overdue flag for restaurant (auto-block)
      await prisma.restaurant.update({
        where: { id: invoice.restaurantId },
        data: { paymentOverdue: true },
      });

      results.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        restaurantId: invoice.restaurantId,
        restaurantName: invoice.restaurant.name,
        amount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        action: "marked_overdue_and_blocked",
      });
    }

    return NextResponse.json({
      message: "Overdue check complete",
      checkedAt: now.toISOString(),
      overdueCount: results.length,
      results,
    });
  } catch (error) {
    console.error("Check overdue error:", error);
    return NextResponse.json(
      { error: "Failed to check overdue invoices" },
      { status: 500 }
    );
  }
}

// GET - Get overdue statistics
export async function GET() {
  try {
    const now = new Date();

    // Get overdue invoices count
    const overdueInvoices = await prisma.invoice.count({
      where: { status: "OVERDUE" },
    });

    // Get blocked restaurants count
    const blockedRestaurants = await prisma.restaurant.count({
      where: { paymentOverdue: true },
    });

    // Get invoices approaching due date (within 3 days)
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const approachingDue = await prisma.invoice.count({
      where: {
        status: "SENT",
        dueDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
      },
    });

    // Get total unpaid amount
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: {
          in: ["SENT", "OVERDUE"],
        },
      },
      select: { totalAmount: true },
    });

    const totalUnpaidAmount = unpaidInvoices.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0
    );

    return NextResponse.json({
      overdueInvoices,
      blockedRestaurants,
      approachingDue,
      totalUnpaidAmount,
    });
  } catch (error) {
    console.error("Get overdue stats error:", error);
    return NextResponse.json(
      { error: "Failed to get overdue statistics" },
      { status: 500 }
    );
  }
}
