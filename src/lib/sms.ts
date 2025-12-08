/**
 * SMS Service for BulkSMSBD
 * API Documentation: https://bulksmsbd.net/developers
 */

interface SMSResponse {
  response_code: number;
  success_message?: string;
  error_message?: string;
}

/**
 * Send SMS via BulkSMSBD API
 * @param phone - Phone number in Bangladesh format (e.g., 8801XXXXXXXXX)
 * @param message - SMS message content
 * @returns Promise<boolean> - true if SMS sent successfully
 */
export async function sendSMS(phone: string, message: string): Promise<boolean> {
  const apiKey = process.env.BULKSMSBD_API_KEY;
  const senderId = process.env.BULKSMSBD_SENDER_ID;

  if (!apiKey || !senderId) {
    console.error("SMS configuration missing: BULKSMSBD_API_KEY or BULKSMSBD_SENDER_ID not set");
    return false;
  }

  // Normalize phone number to Bangladesh format
  const normalizedPhone = normalizePhoneNumber(phone);

  const params = new URLSearchParams({
    api_key: apiKey,
    senderid: senderId,
    number: normalizedPhone,
    message: message,
    type: "text",
  });

  try {
    const response = await fetch(
      `https://bulksmsbd.net/api/smsapi?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      }
    );

    const data: SMSResponse = await response.json();

    // BulkSMSBD Response Codes:
    // 202 = SMS Submitted Successfully
    // 1001 = Invalid Number
    // 1002 = Sender ID not correct/disabled
    // 1007 = Balance Insufficient
    if (data.response_code === 202) {
      console.log(`SMS sent successfully to ${normalizedPhone}`);
      return true;
    } else {
      console.error(`SMS failed with code ${data.response_code}: ${data.error_message || "Unknown error"}`);
      return false;
    }
  } catch (error) {
    console.error("SMS sending error:", error);
    return false;
  }
}

/**
 * Send OTP SMS
 * @param phone - Phone number
 * @param otp - OTP code
 * @returns Promise<boolean>
 */
export async function sendOtpSMS(phone: string, otp: string): Promise<boolean> {
  const message = `Your Dealandme OTP is ${otp}. Valid for 5 minutes. Do not share with anyone.`;
  return sendSMS(phone, message);
}

/**
 * Generate a random 6-digit OTP
 * @returns string - 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Normalize phone number to Bangladesh format (8801XXXXXXXXX)
 * Handles various input formats:
 * - 01XXXXXXXXX -> 8801XXXXXXXXX
 * - +8801XXXXXXXXX -> 8801XXXXXXXXX
 * - 8801XXXXXXXXX -> 8801XXXXXXXXX
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If starts with 0, replace with 880
  if (cleaned.startsWith("0")) {
    cleaned = "88" + cleaned;
  }

  // If doesn't start with 880, add it
  if (!cleaned.startsWith("880")) {
    cleaned = "880" + cleaned;
  }

  return cleaned;
}

/**
 * Check if SMS service is configured
 * @returns boolean
 */
export function isSMSConfigured(): boolean {
  return !!(process.env.BULKSMSBD_API_KEY && process.env.BULKSMSBD_SENDER_ID);
}
