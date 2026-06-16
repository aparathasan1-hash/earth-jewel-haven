import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Stripe Gold checkout — SADECE sunucu tarafı. Secret key istemciye gitmez.
// Webhook yerine "redirect-verification" deseni: ödeme sonrası dönüş URL'inde
// session_id ile activateGoldFromSession çağrılır, sunucu ödemeyi doğrular.

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || "https://kuffihtncrcyvmhciaej.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(url, serviceKey, { auth: { persistSession: false } })
  );
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return import("stripe").then((m) => new m.default(key));
}

// accessToken'dan kullanıcıyı sunucuda doğrula (spoof engeli).
async function verifyUser(accessToken: string): Promise<string | null> {
  const url = process.env.VITE_SUPABASE_URL || "https://kuffihtncrcyvmhciaej.supabase.co";
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!anon) return null;
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data } = await sb.auth.getUser(accessToken);
  return data.user?.id ?? null;
}

/** Gold abonelik checkout oturumu oluştur → Stripe ödeme URL'i döner. */
export const createGoldCheckout = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), origin: z.string().url() }))
  .handler(async ({ data }) => {
    const stripe = await getStripe();
    const priceId = process.env.STRIPE_GOLD_PRICE_ID || process.env.VITE_STRIPE_GOLD_PRICE_ID;
    if (!stripe || !priceId) return { url: null, configured: false };

    const userId = await verifyUser(data.accessToken);
    if (!userId) return { url: null, configured: true, error: "unauthorized" };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      success_url: `${data.origin}/auth/gold?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${data.origin}/auth/gold?upgrade=cancel`,
      metadata: { user_id: userId },
    });
    return { url: session.url, configured: true };
  });

/** Dönüş URL'indeki session_id ile ödemeyi doğrula ve Gold'u etkinleştir. */
export const activateGoldFromSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string(), sessionId: z.string() }))
  .handler(async ({ data }) => {
    const stripe = await getStripe();
    if (!stripe) return { activated: false, configured: false };

    const userId = await verifyUser(data.accessToken);
    if (!userId) return { activated: false, configured: true, error: "unauthorized" };

    const session = await stripe.checkout.sessions.retrieve(data.sessionId);
    // Oturum bu kullanıcıya ait ve ödendi mi?
    if (session.client_reference_id !== userId || session.payment_status !== "paid") {
      return { activated: false, configured: true };
    }

    const supabase = await getServiceClient();
    if (!supabase) return { activated: false, configured: false };
    await supabase.from("profiles").update({ membership_type: "gold" }).eq("id", userId);
    return { activated: true, configured: true };
  });
