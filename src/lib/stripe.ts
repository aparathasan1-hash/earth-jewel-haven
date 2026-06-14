import { loadStripe } from "@stripe/stripe-js";

// Stripe Publishable Key - .env'den al
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";

let stripePromise: ReturnType<typeof loadStripe> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
}

// Gold üyelik fiyat ID'si - Stripe Dashboard'dan alınacak
const GOLD_MEMBERSHIP_PRICE_ID = import.meta.env.VITE_STRIPE_GOLD_PRICE_ID || "";

export async function createCheckoutSession(userId: string) {
  try {
    // Supabase Edge Function veya kendi backend'iniz ile
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        priceId: GOLD_MEMBERSHIP_PRICE_ID,
        successUrl: window.location.origin + "/auth/profile?upgrade=success",
        cancelUrl: window.location.origin + "/auth/profile?upgrade=cancel",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create checkout session");
    }

    const { sessionId } = await response.json();
    return sessionId;
  } catch (error) {
    console.error("❌ Checkout session error:", error);
    throw error;
  }
}

export async function redirectToCheckout(userId: string) {
  const stripe = await getStripe();
  if (!stripe) {
    throw new Error("Stripe failed to load");
  }

  const sessionId = await createCheckoutSession(userId);
  // @ts-expect-error - Stripe types vary by version
  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    console.error("❌ Stripe redirect error:", error);
    throw error;
  }
}
