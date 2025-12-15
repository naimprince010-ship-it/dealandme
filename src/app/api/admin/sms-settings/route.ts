import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSMSConfigured, isTwilioConfigured, isMIMSMSConfigured, SMSProvider } from "@/lib/sms";

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
        {
          id: "mimsms",
          name: "MIM SMS",
          description: "Bangladesh local SMS provider (no IP whitelist, Vercel compatible)",
          configured: isMIMSMSConfigured(),
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

    if (!["ssl", "twilio", "mimsms"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: "sms_provider" },
      update: { value: provider },
      create: { key: "sms_provider", value: provider },
    });

    const providerNames: Record<string, string> = {
      ssl: "SSL Wireless",
      twilio: "Twilio",
      mimsms: "MIM SMS",
    };

    return NextResponse.json({
      success: true,
      message: `SMS provider changed to ${providerNames[provider] || provider}`,
    });
  } catch (error) {
    console.error("Error updating SMS settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
