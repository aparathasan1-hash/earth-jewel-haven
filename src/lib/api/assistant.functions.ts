import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// AI Asistan "Yanında" — sunucu tarafı Claude çağrısı.
// API anahtarı SADECE burada (process.env) okunur, istemciye asla gitmez.
// Anahtar yoksa configured:false döner (UI "henüz aktif değil" gösterir).

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 4096;

// --- Kriz tespiti (çok dilli, basit anahtar kelime taraması) ---
// Amaç: AI'nın tek başına yönetmemesi gereken durumları yakalayıp
// kullanıcıyı acil/profesyonel kaynaklara yönlendirmek.
const CRISIS_PATTERNS = [
  // TR
  "intihar", "kendime zarar", "yaşamak istemiyorum", "ölmek istiyorum",
  "canıma kıy", "bebeğime zarar", "kendimi öldür",
  // EN
  "suicide", "kill myself", "want to die", "end my life", "self harm",
  "self-harm", "hurt my baby", "harm myself",
];

function detectCrisis(text: string): boolean {
  const t = text.toLowerCase();
  return CRISIS_PATTERNS.some((p) => t.includes(p));
}

// --- Sistem promptları (mod bazlı) ---
const SUPPORT_SYSTEM = `You are "Yanında" (meaning "by your side"), a warm, calm companion for postpartum mothers inside the Earth Jewel Haven app.

Your role:
- Offer compassionate, validating emotional support and gentle psychoeducation about the postpartum period (matrescence, sleep, feeding struggles, identity shifts, the "mental load", baby blues vs. postpartum depression awareness).
- Speak in short, warm, human paragraphs. No clinical coldness, no lecturing, no bullet-point dumps unless asked.
- Mirror the user's language (Turkish or English) automatically.

Hard boundaries:
- You are NOT a doctor or therapist. Never diagnose, never prescribe, never give medical dosages. When something sounds medical or risky, gently encourage contacting a healthcare provider.
- Never minimize feelings. Never say "just relax" or "it'll pass".
- If the user expresses self-harm or harm-to-baby intent, do not try to handle it alone — the app surfaces crisis resources separately.

Keep replies focused and not too long. End with warmth, not with a checklist.`;

function bridgeSystem(speaker: "woman" | "man"): string {
  const target = speaker === "woman" ? "man" : "woman";
  const targetDesc =
    target === "woman"
      ? `the message is going TO the mother. Translate it into a WARM, LONGER, context-rich explanation. Add emotional context, soften bluntness, explain the underlying care or intent behind the words, and help her feel understood. It's okay to be gentle and expansive.`
      : `the message is going TO the father/partner. Translate it into a SHORT, CLEAR, ACTIONABLE summary. State the core need and what would actually help, in plain direct language. No long preamble — get to the point with respect.`;

  return `You are "Yanında" — the Couples Bridge inside Earth Jewel Haven, a translator that prevents misunderstanding between new parents during the hard postpartum months.

The speaker is the ${speaker === "woman" ? "mother" : "father/partner"}. ${targetDesc}

Rules:
- Preserve the speaker's true meaning and feelings — never invent content.
- Reframe hostile or loaded phrasing into non-blaming language (e.g. "you never help" → "I feel alone with this and need support").
- Mirror the user's language (Turkish or English).
- Output ONLY the translated/reframed message, ready to be read by the other partner. No meta-commentary, no "here is the translation".
- Be kind to both people. Postpartum strain is normal; your job is to build understanding, not take sides.`;
}

type ChatMsg = { role: "user" | "assistant"; content: string };

export const getAssistantReply = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      mode: z.enum(["support", "couples_bridge"]),
      messages: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string().min(1).max(4000),
          })
        )
        .min(1)
        .max(40),
      // couples_bridge için: konuşan taraf
      speaker: z.enum(["woman", "man"]).optional(),
    })
  )
  .handler(async ({ data }) => {
    const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
    const crisis = lastUser ? detectCrisis(lastUser.content) : false;

    // Kriz tespit edilirse AI'ya gitme — güvenli yönlendirme döndür.
    if (crisis) {
      return {
        configured: true,
        crisis: true,
        reply:
          "Şu an çok zor şeyler hissediyor olabilirsin ve yalnız değilsin. Bunlar tek başına taşınacak duygular değil. Lütfen hemen bir uzmana veya acil destek hattına ulaş — bu bir zayıflık değil, cesaret. Aşağıdaki kaynaklar sana yardımcı olabilir.",
      };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // İskelet modu: anahtar henüz eklenmedi.
      return {
        configured: false,
        crisis: false,
        reply:
          "AI asistan yakında burada olacak 🌿 (Şu an yapılandırma bekleniyor.)",
      };
    }

    const system =
      data.mode === "couples_bridge"
        ? bridgeSystem(data.speaker ?? "woman")
        : SUPPORT_SYSTEM;

    // SDK sadece sunucu tarafında import edilir (istemci bundle'ına girmez).
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: "adaptive" },
        system,
        messages: data.messages as ChatMsg[],
      });

      const text = response.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n")
        .trim();

      return {
        configured: true,
        crisis: false,
        reply: text || "…",
      };
    } catch (err) {
      console.error("❌ Anthropic API hatası:", err);
      return {
        configured: true,
        crisis: false,
        error: true,
        reply:
          "Şu an yanıt veremiyorum, biraz sonra tekrar dener misin? 🌿",
      };
    }
  });
