import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Web Push gönderimi — SADECE sunucu tarafı.
// VAPID private key ve service_role key istemciye asla gitmez.

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string };

async function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || "https://kuffihtncrcyvmhciaej.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/** Bir kullanıcının tüm cihazlarına bildirim gönderir. Sunucu içi yardımcı. */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<{ sent: number; configured: boolean }> {
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hello@example.com";
  if (!publicKey || !privateKey) return { sent: 0, configured: false };

  const supabase = await getServiceClient();
  if (!supabase) return { sent: 0, configured: false };

  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  const subs = (data as SubRow[]) ?? [];
  if (subs.length === 0) return { sent: 0, configured: true };

  const { default: webpush } = await import("web-push");
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const body = JSON.stringify(payload);
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body
        );
        sent++;
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        // Süresi dolmuş/geçersiz abonelikleri temizle
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
        } else {
          console.error("❌ Push gönderim hatası:", err);
        }
      }
    })
  );
  return { sent, configured: true };
}

/** İstemciden çağrılır: kullanıcının kendi cihazlarına test bildirimi gönderir. */
export const sendTestPush = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    return await sendPushToUser(data.userId, {
      title: "The Villageless Mama 🌿",
      body: "Bildirimler çalışıyor! Burada, yanındayız.",
      url: "/auth/profile",
      tag: "test",
    });
  });

async function displayName(
  supabase: NonNullable<Awaited<ReturnType<typeof getServiceClient>>>,
  userId: string
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, username")
    .eq("id", userId)
    .single();
  return (data?.full_name as string) || (data?.username as string) || "Biri";
}

type NotifType = "friend_request" | "friend_accept" | "room_message" | "live_started" | "referral_joined";

// Uygulama içi bildirim oluştur (service_role → RLS bypass). Push ile birlikte çağrılır.
async function createNotif(
  supabase: NonNullable<Awaited<ReturnType<typeof getServiceClient>>>,
  n: { userId: string; actorId?: string; type: NotifType; title: string; body?: string; link?: string }
) {
  try {
    await supabase.from("notifications").insert({
      user_id: n.userId,
      actor_id: n.actorId ?? null,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
    });
  } catch (e) {
    console.warn("createNotif başarısız:", e);
  }
}

/** Arkadaşlık isteği gönderilince addressee'ye bildirim. Sunucu, pending kaydı doğrular. */
export const notifyConnectionRequest = createServerFn({ method: "POST" })
  .inputValidator(z.object({ requesterId: z.string().uuid(), addresseeId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    if (!supabase) return { sent: 0, configured: false };
    const { data: conn } = await supabase
      .from("connections")
      .select("id")
      .eq("requester_id", data.requesterId)
      .eq("addressee_id", data.addresseeId)
      .eq("status", "pending")
      .maybeSingle();
    if (!conn) return { sent: 0, configured: true }; // doğrulanamadı → gönderme
    const name = await displayName(supabase, data.requesterId);
    await createNotif(supabase, {
      userId: data.addresseeId,
      actorId: data.requesterId,
      type: "friend_request",
      title: "Yeni arkadaşlık isteği 🌿",
      body: `${name} sana arkadaşlık isteği gönderdi`,
      link: "/auth/friends",
    });
    return await sendPushToUser(data.addresseeId, {
      title: "Yeni arkadaşlık isteği 🌿",
      body: `${name} sana arkadaşlık isteği gönderdi`,
      url: "/auth/friends",
      tag: "friend-request",
    });
  });

/**
 * Odaya yeni mesaj gelince, o odada daha önce yazmış diğer katılımcılara bildirim.
 * Gönderen hariç. Cihazda tekrarları birleştirmek için oda başına tag kullanılır.
 */
export const notifyRoomMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      roomId: z.string().uuid(),
      senderId: z.string().uuid(),
      preview: z.string().max(120),
    })
  )
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    if (!supabase) return { sent: 0, configured: false };

    // Oda bilgisi + bu odada yazmış benzersiz katılımcılar
    const { data: room } = await supabase
      .from("rooms")
      .select("title")
      .eq("id", data.roomId)
      .maybeSingle();
    const roomTitle = (room?.title as string) || "Bir oda";

    const { data: msgs } = await supabase
      .from("room_messages")
      .select("user_id")
      .eq("room_id", data.roomId);
    const participantIds = Array.from(
      new Set(((msgs as { user_id: string }[]) ?? []).map((m) => m.user_id))
    ).filter((id) => id !== data.senderId);
    if (participantIds.length === 0) return { sent: 0, configured: true };

    const name = await displayName(supabase, data.senderId);
    const link = `/auth/community?roomId=${data.roomId}`;
    const results = await Promise.all(
      participantIds.map(async (id) => {
        await createNotif(supabase, {
          userId: id,
          actorId: data.senderId,
          type: "room_message",
          title: `${roomTitle} 🌿`,
          body: `${name}: ${data.preview}`,
          link,
        });
        return sendPushToUser(id, {
          title: `${roomTitle} 🌿`,
          body: `${name}: ${data.preview}`,
          url: link,
          tag: `room-${data.roomId}`,
        });
      })
    );
    return { sent: results.reduce((a, r) => a + r.sent, 0), configured: true };
  });

/**
 * Bir kullanıcı canlı yayın açınca ARKADAŞLARINA bildirim (in-app + push).
 * Sunucu yayını ve host'u doğrular; arkadaşları connections'tan bulur.
 */
export const notifyLiveStarted = createServerFn({ method: "POST" })
  .inputValidator(z.object({ streamId: z.string().uuid(), hostId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    if (!supabase) return { sent: 0, configured: false };

    const { data: stream } = await supabase
      .from("live_streams")
      .select("title, host_id, status, is_private")
      .eq("id", data.streamId)
      .maybeSingle();
    if (!stream || stream.host_id !== data.hostId || stream.status !== "live" || stream.is_private) {
      return { sent: 0, configured: true };
    }

    // Host'un kabul edilmiş arkadaşları
    const { data: conns } = await supabase
      .from("connections")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${data.hostId},addressee_id.eq.${data.hostId}`);
    const friendIds = Array.from(
      new Set(
        ((conns as { requester_id: string; addressee_id: string }[]) ?? []).map((c) =>
          c.requester_id === data.hostId ? c.addressee_id : c.requester_id
        )
      )
    );
    if (friendIds.length === 0) return { sent: 0, configured: true };

    const name = await displayName(supabase, data.hostId);
    const link = `/auth/watch/${data.streamId}`;
    const title = `${name} canlı yayında 🔴`;
    const body = (stream.title as string) || "Şimdi izle";
    const results = await Promise.all(
      friendIds.map(async (id) => {
        await createNotif(supabase, { userId: id, actorId: data.hostId, type: "live_started", title, body, link });
        return sendPushToUser(id, { title, body, url: link, tag: `live-${data.streamId}` });
      })
    );
    return { sent: results.reduce((a, r) => a + r.sent, 0), configured: true };
  });

/**
 * Davet edilen biri katılınca, davet edene bildirim (in-app + push).
 * Sunucu, bu referrer'a ait en son referral kaydını okuyup davetliyi bildirir.
 */
export const notifyReferralJoined = createServerFn({ method: "POST" })
  .inputValidator(z.object({ referrerId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    if (!supabase) return { sent: 0, configured: false };
    const { data: ref } = await supabase
      .from("referrals")
      .select("referred_id")
      .eq("referrer_id", data.referrerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!ref) return { sent: 0, configured: true };
    const name = await displayName(supabase, ref.referred_id as string);
    const title = "Davetin kabul edildi 🌱";
    const body = `${name} davetinle aramıza katıldı`;
    await createNotif(supabase, {
      userId: data.referrerId,
      actorId: ref.referred_id as string,
      type: "referral_joined",
      title,
      body,
      link: "/auth/invite",
    });
    return await sendPushToUser(data.referrerId, {
      title,
      body,
      url: "/auth/invite",
      tag: "referral",
    });
  });

/** İstek kabul edilince requester'a bildirim. Sunucu, accepted kaydı doğrular. */
export const notifyConnectionAccepted = createServerFn({ method: "POST" })
  .inputValidator(z.object({ connectionId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    if (!supabase) return { sent: 0, configured: false };
    const { data: conn } = await supabase
      .from("connections")
      .select("requester_id, addressee_id, status")
      .eq("id", data.connectionId)
      .maybeSingle();
    if (!conn || conn.status !== "accepted") return { sent: 0, configured: true };
    const name = await displayName(supabase, conn.addressee_id as string);
    await createNotif(supabase, {
      userId: conn.requester_id as string,
      actorId: conn.addressee_id as string,
      type: "friend_accept",
      title: "Arkadaşlık kabul edildi 🌿",
      body: `${name} arkadaşlık isteğini kabul etti`,
      link: "/auth/friends",
    });
    return await sendPushToUser(conn.requester_id as string, {
      title: "Arkadaşlık kabul edildi 🌿",
      body: `${name} arkadaşlık isteğini kabul etti`,
      url: "/auth/friends",
      tag: "friend-accept",
    });
  });
