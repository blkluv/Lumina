// Payment Service - Stripe Integration for Lumina
import crypto from "crypto";

interface CreateCheckoutOptions {
  userId: string;
  email: string;
  productName: string;
  amount: number; // in cents
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

interface CreateTipOptions {
  fromUserId: string;
  toUserId: string;
  amount: number; // in cents
  recipientEmail: string;
  successUrl: string;
  cancelUrl: string;
}

// Initialize Stripe
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Stripe secret key not configured");
  }
  return { secretKey };
}

// Create checkout session for one-time payment
export async function createCheckoutSession(options: CreateCheckoutOptions): Promise<string | null> {
  try {
    const { secretKey } = getStripe();

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "success_url": options.successUrl,
        "cancel_url": options.cancelUrl,
        "customer_email": options.email,
        "line_items[0][price_data][currency]": options.currency || "usd",
        "line_items[0][price_data][product_data][name]": options.productName,
        "line_items[0][price_data][unit_amount]": options.amount.toString(),
        "line_items[0][quantity]": "1",
        "metadata[userId]": options.userId,
        ...(options.metadata ? Object.fromEntries(
          Object.entries(options.metadata).map(([k, v]) => [`metadata[${k}]`, v])
        ) : {}),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Stripe checkout error:", error);
      return null;
    }

    const session = await response.json();
    return session.url;
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return null;
  }
}

// Create tip/donation checkout
export async function createTipCheckout(options: CreateTipOptions): Promise<string | null> {
  return createCheckoutSession({
    userId: options.fromUserId,
    email: options.recipientEmail,
    productName: "Lumina Tip",
    amount: options.amount,
    successUrl: options.successUrl,
    cancelUrl: options.cancelUrl,
    metadata: {
      type: "tip",
      fromUserId: options.fromUserId,
      toUserId: options.toUserId,
    },
  });
}

// Create subscription checkout (for premium features)
export async function createSubscriptionCheckout(options: {
  userId: string;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<string | null> {
  try {
    const { secretKey } = getStripe();

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "subscription",
        "success_url": options.successUrl,
        "cancel_url": options.cancelUrl,
        "customer_email": options.email,
        "line_items[0][price]": options.priceId,
        "line_items[0][quantity]": "1",
        "metadata[userId]": options.userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Stripe subscription error:", error);
      return null;
    }

    const session = await response.json();
    return session.url;
  } catch (error) {
    console.error("Stripe subscription error:", error);
    return null;
  }
}

// Get customer portal URL for managing subscriptions
export async function getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string | null> {
  try {
    const { secretKey } = getStripe();

    const response = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: returnUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Stripe portal error:", error);
      return null;
    }

    const session = await response.json();
    return session.url;
  } catch (error) {
    console.error("Stripe portal error:", error);
    return null;
  }
}

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
}

// Get publishable key for frontend
export function getPublishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY || null;
}

// Stripe Webhook Signature Verification
// Uses HMAC-SHA256 to verify webhook authenticity
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
}

interface WebhookVerificationResult {
  valid: boolean;
  event?: StripeWebhookEvent;
  error?: string;
}

// Verify Stripe webhook signature following Stripe's official specification
export function verifyStripeWebhookSignature(
  payload: Buffer | string,
  signatureHeader: string | undefined
): WebhookVerificationResult {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.error("Stripe webhook secret not configured");
    return { valid: false, error: "Webhook secret not configured" };
  }
  
  if (!signatureHeader) {
    return { valid: false, error: "Missing signature header" };
  }
  
  try {
    // Parse the signature header
    // Format: t=timestamp,v1=signature,v1=signature2
    const elements = signatureHeader.split(",");
    const signatureData: Record<string, string[]> = {};
    
    for (const element of elements) {
      const [key, value] = element.split("=");
      if (!signatureData[key]) {
        signatureData[key] = [];
      }
      signatureData[key].push(value);
    }
    
    const timestamp = signatureData.t?.[0];
    const signatures = signatureData.v1 || [];
    
    if (!timestamp || signatures.length === 0) {
      return { valid: false, error: "Invalid signature header format" };
    }
    
    // Check timestamp to prevent replay attacks (5 minute tolerance)
    const timestampInt = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const tolerance = 5 * 60; // 5 minutes
    
    if (Math.abs(currentTime - timestampInt) > tolerance) {
      return { valid: false, error: "Webhook timestamp too old" };
    }
    
    // Compute expected signature
    const payloadString = typeof payload === "string" ? payload : payload.toString("utf8");
    const signedPayload = `${timestamp}.${payloadString}`;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(signedPayload, "utf8")
      .digest("hex");
    
    // Check if any of the provided signatures match
    const isValid = signatures.some((sig) => {
      try {
        return crypto.timingSafeEqual(
          Buffer.from(expectedSignature, "hex"),
          Buffer.from(sig, "hex")
        );
      } catch {
        return false;
      }
    });
    
    if (!isValid) {
      return { valid: false, error: "Signature verification failed" };
    }
    
    // Parse and return the event
    const event = JSON.parse(payloadString) as StripeWebhookEvent;
    return { valid: true, event };
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return { valid: false, error: "Signature verification failed" };
  }
}

// Get webhook secret status
export function isWebhookSecretConfigured(): boolean {
  return !!process.env.STRIPE_WEBHOOK_SECRET;
}
