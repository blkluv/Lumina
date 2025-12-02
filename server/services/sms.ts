// SMS Service - Twilio Integration for Lumina

interface SMSOptions {
  to: string;
  message: string;
}

interface BulkSMSOptions {
  recipients: string[];
  message: string;
}

// Send single SMS via Twilio
export async function sendSMS(options: SMSOptions): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.error("Twilio credentials not configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: options.to,
          From: fromNumber,
          Body: options.message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Twilio error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Twilio send error:", error);
    return false;
  }
}

// Send bulk SMS
export async function sendBulkSMS(options: BulkSMSOptions): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Twilio requires individual API calls for each recipient
  const results = await Promise.allSettled(
    options.recipients.map(to => sendSMS({ to, message: options.message }))
  );

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

// Pre-built SMS templates
export const smsTemplates = {
  welcome: (username: string) => 
    `Welcome to Lumina, ${username}! Start creating and earning rewards today.`,

  notification: (message: string) => 
    `Lumina: ${message}`,

  verification: (code: string) => 
    `Your Lumina verification code is: ${code}. Valid for 10 minutes.`,

  loginAlert: () => 
    `New login detected on your Lumina account. If this wasn't you, secure your account immediately.`,

  tipReceived: (amount: string, from: string) => 
    `You received ${amount} LUM tip from ${from} on Lumina!`,

  rewardEarned: (points: number) => 
    `You earned ${points} reward points on Lumina! Keep engaging to earn more.`,
};
