import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSMSConfigured, isTwilioConfigured, SMSProvider } from "@/lib/sms";

export async function GET() {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "sms_provider" },
    });

    const currentProvider = (setting?.value || "ssl") as SMSProvider;

    return NextResponse.json({
      currentProvider,
      providers: [
        {
          id: "ssl",
          name: "SSL Wireless",
          description: "Bangladesh local SMS provider (cheaper, requires IP whitelist)",
          configured: isSMSConfigured(),
        },
        {
          id: "twilio",
          name: "Twilio",
          description: "International SMS provider (works with Vercel, no IP restriction)",
          configured: isTwilioConfigured(),
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching SMS settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.userType !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { provider } = await request.json();

    if (!["ssl", "twilio"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: "sms_provider" },
      update: { value: provider },
      create: { key: "sms_provider", value: provider },
    });

    return NextResponse.json({
      success: true,
      message: `SMS provider changed to ${provider === "ssl" ? "SSL Wireless" : "Twilio"}`,
    });
  } catch (error) {
    console.error("Error updating SMS settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
