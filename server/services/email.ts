// Email Service - SendGrid & Resend Integration for Lumina

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface BulkEmailOptions {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
}

// SendGrid for bulk/campaign emails
export async function sendEmailViaSendGrid(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.error("SendGrid API key not configured");
    return false;
  }

  const to = Array.isArray(options.to) ? options.to : [options.to];
  
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: to.map(email => ({ to: [{ email }] })),
        from: { email: options.from || "noreply@lumina.social", name: "Lumina" },
        subject: options.subject,
        content: [
          { type: "text/plain", value: options.text || options.html.replace(/<[^>]*>/g, "") },
          { type: "text/html", value: options.html },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("SendGrid error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("SendGrid send error:", error);
    return false;
  }
}

// Resend for transactional emails (welcome, password reset, notifications)
export async function sendEmailViaResend(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Resend API key not configured");
    return false;
  }

  const to = Array.isArray(options.to) ? options.to : [options.to];

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from || "Lumina <noreply@lumina.social>",
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Resend send error:", error);
    return false;
  }
}

// Unified email sender - uses Resend for transactional, SendGrid for bulk
export async function sendEmail(options: EmailOptions, type: "transactional" | "campaign" = "transactional"): Promise<boolean> {
  if (type === "campaign") {
    return sendEmailViaSendGrid(options);
  }
  return sendEmailViaResend(options);
}

// Bulk email for admin notifications
export async function sendBulkEmail(options: BulkEmailOptions): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // SendGrid supports batch sending
  const result = await sendEmailViaSendGrid({
    to: options.recipients,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (result) {
    success = options.recipients.length;
  } else {
    failed = options.recipients.length;
  }

  return { success, failed };
}

// Pre-built email templates
export const emailTemplates = {
  welcome: (username: string) => ({
    subject: "Welcome to Lumina!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px;">
        <h1 style="color: #10b981;">Welcome to Lumina!</h1>
        <p>Hey ${username},</p>
        <p>Welcome to the future of social media! You've joined a Web3-powered community where your content matters and you earn rewards for engagement.</p>
        <h3>Get Started:</h3>
        <ul>
          <li>Connect your wallet to unlock Web3 features</li>
          <li>Create your first post</li>
          <li>Explore the For You feed</li>
          <li>Join groups that interest you</li>
        </ul>
        <p>Happy creating!</p>
        <p>— The Lumina Team</p>
      </div>
    `,
  }),

  notification: (title: string, message: string) => ({
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px;">
        <h1 style="color: #10b981;">${title}</h1>
        <p>${message}</p>
        <p>— The Lumina Team</p>
      </div>
    `,
  }),

  adminBroadcast: (subject: string, message: string) => ({
    subject: `[Lumina] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981;">Lumina</h1>
        </div>
        <h2>${subject}</h2>
        <div style="line-height: 1.6;">${message.replace(/\n/g, "<br>")}</div>
        <hr style="border: 1px solid #333; margin: 30px 0;">
        <p style="color: #888; font-size: 12px;">This message was sent by the Lumina team.</p>
      </div>
    `,
  }),
};
