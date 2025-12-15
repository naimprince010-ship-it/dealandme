/**
 * SMS Provider Library - Supports multiple providers
 * - SSL Wireless (Bangladesh local provider)
 * - Twilio (International provider)
 * - MIM SMS (Bangladesh local provider - no IP whitelist required)
 */

import { prisma } from "@/lib/prisma";

export type SMSProvider = "ssl" | "twilio" | "mimsms";

interface SSLWirelessResponse {
  status?: "SUCCESS" | "FAILED";
  status_code?: number;
  error_message?: string;
}

interface TwilioResponse {
  sid?: string;
  status?: string;
  error_code?: number;
  error_message?: string;
}

interface MIMSMSResponse {
  statusCode?: string;
  status?: string;
  trxnId?: string;
  responseResult?: string;
}

export async function getSMSProvider(): Promise<SMSProvider> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "sms_provider" },
    });
    if (setting?.value === "twilio") return "twilio";
    if (setting?.value === "mimsms") return "mimsms";
    return "ssl";
  } catch {
    return "ssl";
  }
}

async function sendSMSViaSSL(phone: string, message: string): Promise<boolean> {
  const apiToken = process.env.SSLW_API_TOKEN;
  const senderId = process.env.SSLW_SID;

  if (!apiToken || !senderId) {
    console.error("SSL Wireless env missing");
    return false;
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  const csms_id = Math.random().toString(36).substring(2, 18);

  try {
    const response = await fetch(
      "https://smsplus.sslwireless.com/api/v3/send-sms",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          api_token: apiToken,
          sid: senderId,
          msisdn: normalizedPhone,
          sms: message,
          csms_id,
        }),
      }
    );

    console.log("SSL Wireless HTTP status:", response.status);
    const data: SSLWirelessResponse = await response.json();
    console.log("SSL Wireless response:", JSON.stringify(data));

    if (data?.status === "SUCCESS" && data?.status_code === 200) {
      console.log(`SMS sent successfully via SSL to ${normalizedPhone}`);
      return true;
    }

    console.error("SSL Wireless SMS failed:", JSON.stringify(data));
    return false;
  } catch (error) {
    console.error("SSL Wireless SMS error:", error);
    return false;
  }
}

async function sendSMSViaTwilio(phone: string, message: string): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Twilio env missing");
    return false;
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  const toNumber = `+${normalizedPhone}`;

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          To: toNumber,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    console.log("Twilio HTTP status:", response.status);
    const data: TwilioResponse = await response.json();
    console.log("Twilio response:", JSON.stringify(data));

    if (response.ok && data?.sid) {
      console.log(`SMS sent successfully via Twilio to ${toNumber}`);
      return true;
    }

    console.error("Twilio SMS failed:", JSON.stringify(data));
    return false;
  } catch (error) {
    console.error("Twilio SMS error:", error);
    return false;
  }
}

async function sendSMSViaMIM(phone: string, message: string): Promise<boolean> {
  const username = process.env.MIM_USERNAME;
  const apiKey = process.env.MIM_API_KEY;
  const senderName = process.env.MIM_SENDER_ID;

  if (!username || !apiKey || !senderName) {
    console.error("MIM SMS env missing (need MIM_USERNAME, MIM_API_KEY, MIM_SENDER_ID)");
    return false;
  }

  const normalizedPhone = normalizePhoneNumber(phone);

  try {
    const response = await fetch(
      "https://api.mimsms.com/api/SmsSending/SMS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          UserName: username,
          Apikey: apiKey,
          MobileNumber: normalizedPhone,
          CampaignId: "null",
          SenderName: senderName,
          TransactionType: "T",
          Message: message,
        }),
      }
    );

    console.log("MIM SMS HTTP status:", response.status);
    
    const text = await response.text();
    console.log("MIM SMS raw response:", text);

    let data: MIMSMSResponse | null = null;
    try {
      data = text ? (JSON.parse(text) as MIMSMSResponse) : null;
    } catch (e) {
      console.error("MIM SMS response is not valid JSON:", e);
      return false;
    }

    const success = response.ok && 
      data?.statusCode === "200" &&
      data?.status?.toLowerCase() === "success";

    if (success) {
      console.log(`SMS sent successfully via MIM SMS to ${normalizedPhone}`, data);
      return true;
    }

    console.error("MIM SMS failed:", data);
    return false;
  } catch (error) {
    console.error("MIM SMS error:", error);
    return false;
  }
}

export async function sendSMS(
  phone: string,
  message: string
): Promise<boolean> {
  const provider = await getSMSProvider();
  console.log(`Sending SMS via provider: ${provider}`);

  if (provider === "twilio") {
    return sendSMSViaTwilio(phone, message);
  }
  if (provider === "mimsms") {
    return sendSMSViaMIM(phone, message);
  }
  return sendSMSViaSSL(phone, message);
}

/**
 * OTP sender - BTRC compliant format: (Brand Name) Message
 */
export async function sendOtpSMS(
  phone: string,
  otp: string
): Promise<boolean> {
  const message = `(Dealandme) Your OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
  return sendSMS(phone, message);
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "88" + cleaned;
  if (!cleaned.startsWith("880")) cleaned = "880" + cleaned;
  return cleaned;
}

export function isSMSConfigured(): boolean {
  return Boolean(process.env.SSLW_API_TOKEN && process.env.SSLW_SID);
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  );
}

export function isMIMSMSConfigured(): boolean {
  return Boolean(
    process.env.MIM_USERNAME &&
    process.env.MIM_API_KEY &&
    process.env.MIM_SENDER_ID
  );
}

export function isAnySMSConfigured(): boolean {
  return isSMSConfigured() || isTwilioConfigured() || isMIMSMSConfigured();
}
