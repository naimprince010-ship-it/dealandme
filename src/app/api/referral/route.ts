import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "REF";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    let user = await prisma.user.findUnique({
      where: { id: userId },
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
        where: { id: userId },
        data: { referralCode: code },
        select: { referralCode: true },
      });
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
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

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session || session.userType !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;
    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { error: "Referral code is required" },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredBy: true },
    });

    if (currentUser?.referredBy) {
      return NextResponse.json(
        { error: "You have already used a referral code" },
        { status: 400 }
      );
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
    });

    if (!referrer) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    if (referrer.id === userId) {
      return NextResponse.json(
        { error: "You cannot use your own referral code" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { referredBy: referrer.id },
      }),
      prisma.referral.create({
        data: {
          referrerId: referrer.id,
          referredId: userId,
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
