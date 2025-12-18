import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSessionToken } from "@/lib/auth";
import { normalizePhoneNumber, isSMSConfigured } from "@/lib/sms";

// Customer session duration: 30 days
const CUSTOMER_SESSION_DURATION_DAYS = 30;

const MOCK_OTP = "123456";
const MAX_VERIFY_ATTEMPTS = 3;

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

    // Check if we should require real OTP (production only, not preview)
    const isPreview = isPreviewEnvironment(request);
    const requireRealOtp = isSMSConfigured() && !isPreview;

    // If SMS is configured and not in preview, validate against stored OTP
    if (requireRealOtp) {
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

    // Create session token and expiry
    const token = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CUSTOMER_SESSION_DURATION_DAYS);

    // Save session to database
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        userType: "CUSTOMER",
        expiresAt,
      },
    });

    // Build response with cookie set directly on the response object
    // This is more explicit than using cookies() from next/headers
    // and ensures the Set-Cookie header is definitely on this response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
      },
    });

    // Set cookie directly on the response object
    response.cookies.set("dealbox_customer_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
