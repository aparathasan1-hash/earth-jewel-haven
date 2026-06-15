import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// LiveKit erişim token üretimi — SADECE sunucu tarafı.
// LIVEKIT_API_KEY / LIVEKIT_API_SECRET istemciye asla gitmez.

async function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || "https://kuffihtncrcyvmhciaej.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Bir yayın odasına katılım için LiveKit token üretir.
 * - role='host': yalnızca yayının gerçek host'una publish izni verilir (sunucu doğrular).
 * - role='viewer': yalnız izleme/sohbet (publish yok).
 * Anahtar yoksa { configured:false } döner (skeleton mod).
 */
export const createLiveToken = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      streamId: z.string().uuid(),
      identity: z.string().uuid(),
      name: z.string().max(80).optional(),
      role: z.enum(["host", "viewer"]),
    })
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const url = process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_URL;
    if (!apiKey || !apiSecret || !url) {
      return { configured: false, token: null as string | null, url: null as string | null };
    }

    // Publish izni: yalnızca yayının gerçek sahibi yayınlayabilir.
    let canPublish = false;
    if (data.role === "host") {
      const supabase = await getServiceClient();
      if (supabase) {
        const { data: stream } = await supabase
          .from("live_streams")
          .select("host_id, status")
          .eq("id", data.streamId)
          .maybeSingle();
        canPublish = !!stream && stream.host_id === data.identity;
      }
    }

    const { AccessToken } = await import("livekit-server-sdk");
    const at = new AccessToken(apiKey, apiSecret, {
      identity: data.identity,
      name: data.name,
      ttl: "2h",
    });
    at.addGrant({
      roomJoin: true,
      room: data.streamId,
      canPublish,
      canSubscribe: true,
      canPublishData: true, // sohbet/etkileşim data kanalı
    });
    const token = await at.toJwt();
    return { configured: true, token, url };
  });
