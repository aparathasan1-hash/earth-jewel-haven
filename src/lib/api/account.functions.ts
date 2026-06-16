import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Hesap silme — SADECE sunucu tarafı (service role).
// Güvenlik: çağıranın kimliği access token ile DOĞRULANIR; yalnız kendi hesabını siler.

async function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL || "https://kuffihtncrcyvmhciaej.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Kullanıcının kendi hesabını kalıcı siler.
 * accessToken sunucuda doğrulanır → o token'a ait kullanıcı silinir (başkası değil).
 * profiles → auth.users FK CASCADE ile bağlı tüm kişisel veri de silinir.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ accessToken: z.string().min(10) }))
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    if (!supabase) return { ok: false, reason: "not_configured" as const };

    // Token'dan kullanıcıyı doğrula
    const { data: userData, error: uErr } = await supabase.auth.getUser(data.accessToken);
    if (uErr || !userData?.user) return { ok: false, reason: "unauthorized" as const };
    const userId = userData.user.id;

    // Profil satırını sil (çoğu veri buna CASCADE bağlı), sonra auth kullanıcısını sil
    await supabase.from("profiles").delete().eq("id", userId);
    const { error: dErr } = await supabase.auth.admin.deleteUser(userId);
    if (dErr) return { ok: false, reason: "delete_failed" as const };

    return { ok: true as const };
  });
