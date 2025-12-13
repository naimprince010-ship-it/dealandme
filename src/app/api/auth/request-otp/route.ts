import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, sendOtpSMS, isSMSConfigured, normalizePhoneNumber } from "@/lib/sms";

const OTP_EXPIRY_MINUTES = 5;

// Helper to detect preview environment - allows mock OTP in preview deployments
function isPreviewEnvironment(req: NextRequest): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview") return true;
  
  // Also check host for preview URLs
  const host = req.headers.get("host") || "";
  if (host.includes("-git-") && host.includes(".vercel.app")) return true;
  
  return false;
}
const OTP_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS_PER_HOUR = 5;

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate phone number format (Bangladesh: 01XXXXXXXXX or 8801XXXXXXXXX)
    const phoneRegex = /^(\+?880)?0?1[3-9]\d{8}$/;
    const cleanedPhone = phone.replace(/[\s-]/g, "");
    if (!phoneRegex.test(cleanedPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Use Bangladesh number (01XXXXXXXXX)" },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(cleanedPhone);

    // Check rate limiting - max OTP requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtpCount = await prisma.otpCode.count({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentOtpCount >= MAX_OTP_ATTEMPTS_PER_HOUR) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 }
      );
    }

    // Check cooldown - prevent rapid requests
    const cooldownTime = new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000);
    const recentOtp = await prisma.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: cooldownTime },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentOtp) {
      const waitSeconds = Math.ceil(
        (recentOtp.createdAt.getTime() + OTP_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: `Please wait ${waitSeconds} seconds before requesting another OTP` },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in database
    await prisma.otpCode.create({
      data: {
        phone: normalizedPhone,
        code: otp,
        expiresAt,
      },
    });

    // Check if we should use real SMS (production only, not preview)
    const isPreview = isPreviewEnvironment(request);
    const shouldUseSMS = isSMSConfigured() && !isPreview;

    // Send OTP via SMS if configured and not in preview, otherwise use mock mode
    if (shouldUseSMS) {
      const smsSent = await sendOtpSMS(normalizedPhone, otp);
      if (!smsSent) {
        return NextResponse.json(
          { error: "Failed to send OTP. Please try again." },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
      });
    } else {
      // Mock mode for development/testing/preview - accepts 123456
      console.log(`[DEV/PREVIEW MODE] OTP for ${normalizedPhone}: ${otp}`);
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully (use 123456 for testing)",
      });
    }
  } catch (error) {
    console.error("Request OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
