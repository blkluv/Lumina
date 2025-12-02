// Payment Service - Stripe Integration for Lumina

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
