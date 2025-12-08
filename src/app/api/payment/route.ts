import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// POST - Initiate payment for an invoice
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { invoiceId, paymentMethod } = body;

    if (!invoiceId || !paymentMethod) {
      return NextResponse.json(
        { error: "Invoice ID and payment method required" },
        { status: 400 }
      );
    }

    // Verify invoice belongs to this restaurant
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        restaurant: {
          select: { name: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.restaurantId !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Invoice cannot be paid" },
        { status: 400 }
      );
    }

    // Generate a unique transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // For MVP, we'll create a payment record and return payment instructions
    // In production, this would integrate with bKash/SSLCommerz API
    const paymentInfo = generatePaymentInfo(
      paymentMethod,
      invoice.totalAmount,
      invoice.invoiceNumber,
      transactionId
    );

    return NextResponse.json({
      message: "Payment initiated",
      transactionId,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.totalAmount,
      paymentMethod,
      paymentInfo,
    });
  } catch (error) {
    console.error("Initiate payment error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}

// PATCH - Confirm payment (for manual confirmation or webhook callback)
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    // Allow both restaurant (self-report) and admin (verification)
    if (session.type !== "RESTAURANT" && session.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { invoiceId, transactionId, paymentMethod } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // If restaurant, verify ownership
    if (session.type === "RESTAURANT" && invoice.restaurantId !== session.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 }
      );
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Invoice is cancelled" },
        { status: 400 }
      );
    }

    // Update invoice as paid
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: paymentMethod || "online",
        transactionId: transactionId || null,
      },
    });

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

    return NextResponse.json({
      message: "Payment confirmed",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}

function generatePaymentInfo(
  method: string,
  amount: number,
  invoiceNumber: string,
  transactionId: string
): Record<string, string> {
  switch (method) {
    case "bkash":
      return {
        type: "bKash",
        merchantNumber: "01XXXXXXXXX", // Replace with actual bKash merchant number
        reference: invoiceNumber,
        instructions: `Send ৳${amount} to bKash merchant number. Use reference: ${invoiceNumber}. After payment, note the Transaction ID and confirm payment.`,
      };
    case "nagad":
      return {
        type: "Nagad",
        merchantNumber: "01XXXXXXXXX", // Replace with actual Nagad merchant number
        reference: invoiceNumber,
        instructions: `Send ৳${amount} to Nagad merchant number. Use reference: ${invoiceNumber}. After payment, note the Transaction ID and confirm payment.`,
      };
    case "bank":
      return {
        type: "Bank Transfer",
        bankName: "Dutch Bangla Bank",
        accountNumber: "XXXXXXXXXXXX", // Replace with actual bank account
        accountName: "Dealandme Ltd",
        reference: invoiceNumber,
        instructions: `Transfer ৳${amount} to the bank account. Use reference: ${invoiceNumber}. After transfer, confirm payment with transaction ID.`,
      };
    default:
      return {
        type: "Manual",
        reference: invoiceNumber,
        transactionId,
        instructions: `Pay ৳${amount} using your preferred method. Reference: ${invoiceNumber}. Contact admin to confirm payment.`,
      };
  }
}
