/**
 * SSL Wireless Push SMS (API v3.0.0) – Document compliant
 */

interface SSLWirelessResponse {
  status?: "SUCCESS" | "FAILED";
  status_code?: number;
  error_message?: string;
}

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

  // csms_id must be <= 20 chars and unique per day
  const csms_id = Math.random().toString(36).substring(2, 18);

  try {
    // SSL Wireless API v3.0.0 uses JSON format
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

    // Check for success - SSL Wireless returns status "SUCCESS" with status_code 200
    if (data?.status === "SUCCESS" && data?.status_code === 200) {
      console.log(`SMS sent successfully to ${normalizedPhone}`);
      return true;
    }
    
    console.error("SSL Wireless SMS failed:", JSON.stringify(data));
    return false;
  } catch (error) {
    console.error("SSL Wireless SMS error:", error);
    return false;
  }
}

/**
 * OTP sender
 */
export async function sendOtpSMS(
  phone: string,
  otp: string
): Promise<boolean> {
  const message = `Your Dealandme OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
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
