import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, sendOtpSMS, isSMSConfigured, normalizePhoneNumber } from "@/lib/sms";

const OTP_EXPIRY_MINUTES = 5;
const OTP_COOLDOWN_SECONDS = 30;
const MAX_OTP_PER_DAY = 5;

// Helper to detect preview environment - allows mock OTP in preview deployments
function isPreviewEnvironment(req: NextRequest): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv === "preview") return true;
  
  // Also check host for preview URLs
  const host = req.headers.get("host") || "";
  if (host.includes("-git-") && host.includes(".vercel.app")) return true;
  
  return false;
}

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

    // Check rate limiting - max OTP requests per DAY (not hour)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyOtpCount = await prisma.otpCode.count({
      where: {
        phone: normalizedPhone,
        createdAt: { gte: oneDayAgo },
      },
    });

    if (dailyOtpCount >= MAX_OTP_PER_DAY) {
      return NextResponse.json(
        { error: "আজকের জন্য OTP limit শেষ। কাল আবার চেষ্টা করুন।" },
        { status: 429 }
      );
    }

    // Check if there's already a valid (unexpired, unverified) OTP for this phone
    // If yes, reuse it instead of generating a new one (saves SMS cost)
    const existingValidOtp = await prisma.otpCode.findFirst({
      where: {
        phone: normalizedPhone,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check cooldown - prevent rapid requests (only if no valid OTP exists)
    if (existingValidOtp) {
      const cooldownTime = new Date(Date.now() - OTP_COOLDOWN_SECONDS * 1000);
      if (existingValidOtp.createdAt >= cooldownTime) {
        const waitSeconds = Math.ceil(
          (existingValidOtp.createdAt.getTime() + OTP_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
        );
        return NextResponse.json(
          { error: `${waitSeconds} সেকেন্ড অপেক্ষা করুন। আগের OTP এখনও valid আছে।` },
          { status: 429 }
        );
      }
    }

    // Check if we should use real SMS (production only, not preview)
    const isPreview = isPreviewEnvironment(request);
    const shouldUseSMS = isSMSConfigured() && !isPreview;

    // If there's a valid OTP that hasn't been sent recently, reuse it (no new SMS needed)
    // This saves SMS cost when users click "Resend" multiple times
    if (existingValidOtp) {
      // OTP still valid - just tell user to use the existing one (no new SMS sent)
      if (shouldUseSMS) {
        return NextResponse.json({
          success: true,
          message: "আগের OTP এখনও valid আছে। সেটি ব্যবহার করুন।",
          reused: true,
        });
      } else {
        console.log(`[DEV/PREVIEW MODE] Reusing OTP for ${normalizedPhone}: ${existingValidOtp.code}`);
        return NextResponse.json({
          success: true,
          message: "আগের OTP এখনও valid আছে (use 123456 for testing)",
          reused: true,
        });
      }
    }

    // No valid OTP exists - generate a new one
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

    // Send OTP via SMS if configured and not in preview, otherwise use mock mode
    if (shouldUseSMS) {
      const smsSent = await sendOtpSMS(normalizedPhone, otp);
      if (!smsSent) {
        return NextResponse.json(
          { error: "OTP পাঠাতে ব্যর্থ। আবার চেষ্টা করুন।" },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: "OTP পাঠানো হয়েছে",
      });
    } else {
      // Mock mode for development/testing/preview - accepts 123456
      console.log(`[DEV/PREVIEW MODE] OTP for ${normalizedPhone}: ${otp}`);
      return NextResponse.json({
        success: true,
        message: "OTP পাঠানো হয়েছে (use 123456 for testing)",
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
