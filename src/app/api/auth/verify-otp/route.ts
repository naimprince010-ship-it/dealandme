import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const MOCK_OTP = "123456";

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string") {
      return NextResponse.json(
        { error: "OTP is required" },
        { status: 400 }
      );
    }

    if (otp !== MOCK_OTP) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 401 }
      );
    }

    const normalizedPhone = phone.replace(/\D/g, "").slice(-10);

    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalizedPhone },
      });
    }

    await createSession(user.id, "CUSTOMER");

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
