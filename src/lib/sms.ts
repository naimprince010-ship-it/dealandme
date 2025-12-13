/**
 * SMS Service for SSL Wireless (SMSPlus)
 * Uses application/x-www-form-urlencoded (required by SSL Wireless)
 */

export async function sendSMS(
  phone: string,
  message: string
): Promise<boolean> {
  const apiToken = process.env.SSLW_API_TOKEN;
  const senderId = process.env.SSLW_SID;

  if (!apiToken || !senderId) {
    console.error("SSL Wireless env missing");
    return false;
  }

  const normalizedPhone = normalizePhoneNumber(phone);

  try {
    const params = new URLSearchParams({
      api_token: apiToken,
      sid: senderId,
      msisdn: normalizedPhone,
      sms: message,
      csms_id: `dealandme_${Date.now()}`,
    });

    const response = await fetch(
      "https://smsplus.sslwireless.com/api/v3/send-sms",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const data = await response.json().catch(() => ({}));

    console.log("SSL Wireless response:", data);

    const success =
      response.ok &&
      (data?.status === "SUCCESS" ||
        data?.status_code === 200);

    return success;
  } catch (error) {
    console.error("SSL Wireless SMS error:", error);
    return false;
  }
}

/**
 * Send OTP SMS
 */
export async function sendOtpSMS(
  phone: string,
  otp: string
): Promise<boolean> {
  const message = `Your Dealandme OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
  return sendSMS(phone, message);
}

/**
 * Generate 6 digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Normalize phone number to Bangladesh format (8801XXXXXXXXX)
 */
export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("0")) {
    cleaned = "88" + cleaned;
  }

  if (!cleaned.startsWith("880")) {
    cleaned = "880" + cleaned;
  }

  return cleaned;
}

/**
 * Check if SMS service is configured
 */
export function isSMSConfigured(): boolean {
  return Boolean(process.env.SSLW_API_TOKEN && process.env.SSLW_SID);
}
