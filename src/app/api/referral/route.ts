import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// Generate a unique referral code
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "REF";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET - Get user's referral code and stats
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    if (session.type !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user with referral code
    let user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { referralCode: true },
    });

    // Generate referral code if not exists
    if (!user?.referralCode) {
      let code = generateReferralCode();
      let attempts = 0;
      
      // Ensure unique code
      while (attempts < 10) {
        const existing = await prisma.user.findUnique({
          where: { referralCode: code },
        });
        if (!existing) break;
        code = generateReferralCode();
        attempts++;
      }

      user = await prisma.user.update({
        where: { id: session.id },
        data: { referralCode: code },
        select: { referralCode: true },
      });
    }

    // Get referral stats
    const referrals = await prisma.referral.findMany({
      where: { referrerId: session.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      referralCode: user?.referralCode,
      referralLink: `https://www.dealandme.com/login?ref=${user?.referralCode}`,
      totalReferrals: referrals.length,
      bonusAwarded: referrals.filter((r) => r.bonusAwarded).length,
    });
  } catch (error) {
    console.error("Get referral error:", error);
    return NextResponse.json(
      { error: "Failed to fetch referral info" },
      { status: 500 }
    );
  }
}

// POST - Apply referral code (called during signup)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    if (session.type !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    // Check if user already has a referrer
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { referredBy: true },
    });

    if (currentUser?.referredBy) {
      return NextResponse.json(
        { error: "You have already used a referral code" },
        { status: 400 }
      );
    }

    // Find referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    // Can't refer yourself
    if (referrer.id === session.id) {
      return NextResponse.json(
        { error: "You cannot use your own referral code" },
        { status: 400 }
      );
    }

    // Create referral record and update user
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.id },
        data: { referredBy: referrer.id },
      }),
      prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: session.id,
          bonusAwarded: false,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Referral code applied successfully!",
    });
  } catch (error) {
    console.error("Apply referral error:", error);
    return NextResponse.json(
      { error: "Failed to apply referral code" },
      { status: 500 }
    );
  }
}
