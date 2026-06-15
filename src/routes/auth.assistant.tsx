import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Loader2, Heart, Users, MessageCircle, ShieldAlert, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  createConversation,
  addAiMessage,
  type AiMode,
} from "@/lib/auth";
import { getAssistantReply } from "@/lib/api/assistant.functions";

export const Route = createFileRoute("/auth/assistant")({
  head: () => ({
    meta: [
      { title: "Yanında — The Villageless Mama" },
      { name: "description", content: "A gentle companion by your side." },
    ],
  }),
  component: AssistantPage,
});

type UiMsg = { role: "user" | "assistant"; content: string };

function AssistantPage() {
  const t = useT();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [mode, setMode] = useState<AiMode>("support");
  const [speaker, setSpeaker] = useState<"woman" | "man">("woman");
  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) {
        navigate({ to: "/auth/login" });
        return;
      }
      setUserId(u.id);
    });
  }, [navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Mod/konuşan değişince yeni sohbet başlat
  function switchMode(m: AiMode) {
    if (m === mode) return;
    setMode(m);
    setMessages([]);
    setCrisis(false);
    conversationIdRef.current = null;
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !userId || sending) return;

    setSending(true);
    setCrisis(false);
    const userMsg: UiMsg = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");

    try {
      // Sohbet yoksa oluştur
      if (!conversationIdRef.current) {
        const conv = await createConversation(userId, mode, text.slice(0, 60));
        conversationIdRef.current = conv.id;
      }
      const convId = conversationIdRef.current;

      // Kullanıcı mesajını kaydet
      await addAiMessage(convId, userId, "user", text, mode === "couples_bridge" ? { speaker } : undefined);

      // Claude yanıtını al
      const res = await getAssistantReply({
        data: {
          mode,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          speaker: mode === "couples_bridge" ? speaker : undefined,
        },
      });

      if (res.crisis) setCrisis(true);
      setNotConfigured(!res.configured);

      const assistantMsg: UiMsg = { role: "assistant", content: res.reply };
      setMessages((prev) => [...prev, assistantMsg]);
      await addAiMessage(convId, userId, "assistant", res.reply, res.crisis ? { crisis: true } : undefined);
    } catch (err) {
      console.error("❌ Assistant error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("assistant.error") || "Bir şeyler ters gitti, tekrar dener misin? 🌿" },
      ]);
    } finally {
      setSending(false);
    }
  }

  const placeholder =
    mode === "couples_bridge"
      ? speaker === "woman"
        ? t("assistant.bridgePlaceholderWoman") || "Eşine aktarmak istediğini yaz…"
        : t("assistant.bridgePlaceholderMan") || "Eşinin sana söylediğini / söylemek istediğini yaz…"
      : t("assistant.placeholder") || "İçinden geçeni paylaş…";

  return (
    <div className="mx-auto flex h-[calc(100dvh-7rem)] max-w-2xl flex-col px-4 pt-6">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <Link to="/auth/profile" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <h1 className="flex items-center gap-2 font-serif text-2xl text-foreground">
          <Sparkles className="h-5 w-5 text-accent" /> {t("assistant.title") || "Yanında"}
        </h1>
      </div>

      {/* Mode tabs */}
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => switchMode("support")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "support" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary/40"
          }`}
        >
          <Heart className="h-3.5 w-3.5" /> {t("assistant.modeSupport") || "Destek"}
        </button>
        <button
          onClick={() => switchMode("couples_bridge")}
          className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "couples_bridge" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary/40"
          }`}
        >
          <Users className="h-3.5 w-3.5" /> {t("assistant.modeBridge") || "Çiftler Köprüsü"}
        </button>
      </div>

      {/* Couples bridge: speaker selector */}
      {mode === "couples_bridge" && (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{t("assistant.speakerLabel") || "Konuşan:"}</span>
          <button
            onClick={() => { setSpeaker("woman"); setMessages([]); conversationIdRef.current = null; }}
            className={`rounded-full px-3 py-1 ${speaker === "woman" ? "bg-secondary text-accent font-medium" : "text-muted-foreground hover:bg-secondary/40"}`}
          >
            {t("assistant.speakerWoman") || "Ben (anne) → eşime"}
          </button>
          <button
            onClick={() => { setSpeaker("man"); setMessages([]); conversationIdRef.current = null; }}
            className={`rounded-full px-3 py-1 ${speaker === "man" ? "bg-secondary text-accent font-medium" : "text-muted-foreground hover:bg-secondary/40"}`}
          >
            {t("assistant.speakerMan") || "Eşim → bana açıkla"}
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <p className="mb-3 rounded-lg bg-secondary/40 px-3 py-2 text-[11px] text-muted-foreground">
        {t("assistant.disclaimer") ||
          "Yanında bir uzman/doktor değildir, tıbbi tavsiye vermez. Acil durumda bir sağlık profesyoneline başvur."}
      </p>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-2">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <MessageCircle className="mb-3 h-10 w-10 opacity-40" />
            <p className="text-sm">
              {mode === "couples_bridge"
                ? t("assistant.emptyBridge") || "Söylemek istediğini yaz, ben şefkatli bir dille çevireyim."
                : t("assistant.emptySupport") || "Buradayım. İçinden geçeni paylaşabilirsin."}
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-secondary px-4 py-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Crisis resources */}
      {crisis && (
        <div className="mb-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <p className="flex items-center gap-2 font-medium text-destructive">
            <ShieldAlert className="h-4 w-4" /> {t("assistant.crisisTitle") || "Yalnız değilsin"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("assistant.crisisBody") ||
              "Acil bir durumda 112'yi ara. Ücretsiz psikolojik destek için yerel bir uzmana veya destek hattına ulaşabilirsin. Bu duyguları bir profesyonelle paylaşmak önemli."}
          </p>
        </div>
      )}

      {notConfigured && (
        <p className="mb-2 text-center text-[11px] text-muted-foreground">
          {t("assistant.notConfigured") || "AI asistan yakında aktif olacak 🌿"}
        </p>
      )}

      {/* Composer */}
      <div className="mb-4 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          rows={2}
          className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
