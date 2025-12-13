import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

// GET - Get all invoices with filtering
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month");
    const status = searchParams.get("status");
    const restaurantId = searchParams.get("restaurantId");

    const where: Record<string, unknown> = {};
    if (month) where.billingMonth = month;
    if (status) where.status = status;
    if (restaurantId) where.restaurantId = restaurantId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            area: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Get invoices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST - Generate invoices for a billing month
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { month, restaurantId } = body;

    if (!month) {
      return NextResponse.json(
        { error: "Billing month required" },
        { status: 400 }
      );
    }

    // Get restaurants to generate invoices for
    const restaurantWhere: Record<string, unknown> = { isActive: true };
    if (restaurantId) restaurantWhere.id = restaurantId;

    const restaurants = await prisma.restaurant.findMany({
      where: restaurantWhere,
      select: {
        id: true,
        name: true,
        commissionRate: true,
      },
    });

    // Get redeemed coupons for the billing month
    const monthStart = new Date(month + "-01");
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const results = [];

    for (const restaurant of restaurants) {
      // Check if invoice already exists
      const existingInvoice = await prisma.invoice.findUnique({
        where: {
          restaurantId_billingMonth: {
            restaurantId: restaurant.id,
            billingMonth: month,
          },
        },
      });

      if (existingInvoice) {
        results.push({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          status: "skipped",
          reason: "Invoice already exists",
          invoiceId: existingInvoice.id,
        });
        continue;
      }

      // Get redeemed coupons for this restaurant
      const redeemedCoupons = await prisma.coupon.findMany({
        where: {
          restaurantId: restaurant.id,
          status: "USED",
          redeemedAt: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        select: { id: true },
      });

      if (redeemedCoupons.length === 0) {
        results.push({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          status: "skipped",
          reason: "No redeemed coupons",
        });
        continue;
      }

      // Calculate total amount
      const totalCoupons = redeemedCoupons.length;
      const totalAmount = totalCoupons * restaurant.commissionRate;

      // Generate invoice number
      const invoiceNumber = generateInvoiceNumber(restaurant.id, month);

      // Set due date to 15th of next month
      const dueDate = new Date(monthEnd);
      dueDate.setDate(15);

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          restaurantId: restaurant.id,
          billingMonth: month,
          totalAmount,
          totalCoupons,
          commissionRate: restaurant.commissionRate,
          status: "DRAFT",
          dueDate,
        },
      });

      // Create commission records and link to invoice
      for (const coupon of redeemedCoupons) {
        // Check if commission already exists
        const existingCommission = await prisma.commission.findFirst({
          where: { couponId: coupon.id },
        });

        if (existingCommission) {
          // Update existing commission with invoice link
          await prisma.commission.update({
            where: { id: existingCommission.id },
            data: { invoiceId: invoice.id },
          });
        } else {
          // Create new commission record
          await prisma.commission.create({
            data: {
              restaurantId: restaurant.id,
              couponId: coupon.id,
              amount: restaurant.commissionRate,
              billingMonth: month,
              invoiceId: invoice.id,
            },
          });
        }
      }

      results.push({
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        status: "created",
        invoiceId: invoice.id,
        invoiceNumber,
        totalAmount,
        totalCoupons,
      });
    }

    return NextResponse.json({
      message: "Invoice generation complete",
      results,
    });
  } catch (error) {
    console.error("Generate invoices error:", error);
    return NextResponse.json(
      { error: "Failed to generate invoices" },
      { status: 500 }
    );
  }
}

// PATCH - Update invoice status (send, mark paid, cancel)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, action, paymentMethod, transactionId } = body;

    if (!invoiceId || !action) {
      return NextResponse.json(
        { error: "Invoice ID and action required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "send":
        if (invoice.status !== "DRAFT") {
          return NextResponse.json(
            { error: "Can only send draft invoices" },
            { status: 400 }
          );
        }
        updateData = { status: "SENT" };
        break;

      case "mark_paid":
        if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
          return NextResponse.json(
            { error: "Cannot mark this invoice as paid" },
            { status: 400 }
          );
        }
        updateData = {
          status: "PAID",
          paidAt: new Date(),
          paymentMethod: paymentMethod || "manual",
          transactionId: transactionId || null,
        };

        // Mark all commissions as paid
        await prisma.commission.updateMany({
          where: { invoiceId },
          data: { isPaid: true, paidAt: new Date() },
        });

        // Clear payment overdue flag for restaurant
        await prisma.restaurant.update({
          where: { id: invoice.restaurantId },
          data: { paymentOverdue: false },
        });
        break;

      case "cancel":
        if (invoice.status === "PAID") {
          return NextResponse.json(
            { error: "Cannot cancel paid invoice" },
            { status: 400 }
          );
        }
        updateData = { status: "CANCELLED" };
        break;

      case "mark_overdue":
        if (invoice.status !== "SENT") {
          return NextResponse.json(
            { error: "Can only mark sent invoices as overdue" },
            { status: 400 }
          );
        }
        updateData = { status: "OVERDUE" };

        // Set payment overdue flag for restaurant (auto-block)
        await prisma.restaurant.update({
          where: { id: invoice.restaurantId },
          data: { paymentOverdue: true },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
    });

    return NextResponse.json({
      message: `Invoice ${action} successful`,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Update invoice error:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

function generateInvoiceNumber(restaurantId: string, month: string): string {
  const prefix = "INV";
  const restaurantCode = restaurantId.substring(0, 4).toUpperCase();
  const monthCode = month.replace("-", "");
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${restaurantCode}-${monthCode}-${timestamp}`;
}
