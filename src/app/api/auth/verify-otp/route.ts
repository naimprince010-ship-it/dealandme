import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { normalizePhoneNumber, isSMSConfigured } from "@/lib/sms";

const MOCK_OTP = "123456";
const MAX_VERIFY_ATTEMPTS = 3;

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

    const normalizedPhone = normalizePhoneNumber(phone);

    // If SMS is configured, validate against stored OTP
    if (isSMSConfigured()) {
      // Find the latest valid OTP for this phone
      const storedOtp = await prisma.otpCode.findFirst({
        where: {
          phone: normalizedPhone,
          verified: false,
          expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!storedOtp) {
        return NextResponse.json(
          { error: "OTP expired or not found. Please request a new one." },
          { status: 401 }
        );
      }

      // Check max attempts
      if (storedOtp.attempts >= MAX_VERIFY_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many failed attempts. Please request a new OTP." },
          { status: 429 }
        );
      }

      // Verify OTP
      if (storedOtp.code !== otp) {
        // Increment attempts
        await prisma.otpCode.update({
          where: { id: storedOtp.id },
          data: { attempts: storedOtp.attempts + 1 },
        });
        return NextResponse.json(
          { error: "Invalid OTP" },
          { status: 401 }
        );
      }

      // Mark OTP as verified
      await prisma.otpCode.update({
        where: { id: storedOtp.id },
        data: { verified: true },
      });
    } else {
      // Mock mode - accept 123456 OR any stored OTP for testing
      const storedOtp = await prisma.otpCode.findFirst({
        where: {
          phone: normalizedPhone,
          verified: false,
          expiresAt: { gte: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      const isValidOtp = otp === MOCK_OTP || (storedOtp && storedOtp.code === otp);
      
      if (!isValidOtp) {
        return NextResponse.json(
          { error: "Invalid OTP" },
          { status: 401 }
        );
      }

      // Mark OTP as verified if it was a stored one
      if (storedOtp && storedOtp.code === otp) {
        await prisma.otpCode.update({
          where: { id: storedOtp.id },
          data: { verified: true },
        });
      }
    }

    // Create or find user
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
