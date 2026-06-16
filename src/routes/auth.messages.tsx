import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send, User, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  getProfile,
  getDmThreads,
  getDmMessages,
  sendDirectMessage,
  markDmRead,
  uploadChatMedia,
  type DmThread,
  type DirectMessage,
  type Profile,
} from "@/lib/auth";
import { ChatMediaBar, type RecordedMedia } from "@/components/villa/ChatMediaBar";

export const Route = createFileRoute("/auth/messages")({
  head: () => ({
    meta: [
      { title: "Messages — The Villageless Mama" },
      { name: "description", content: "Private messages with your friends." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { partner?: string } => ({
    partner: typeof search.partner === "string" ? search.partner : undefined,
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const t = useT();
  const navigate = useNavigate();
  const { partner } = Route.useSearch() as { partner?: string };
  const [userId, setUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<DmThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState("");
  const [mediaUploading, setMediaUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // Kullanıcı + konuşma listesi
  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      setUserId(user.id);
      try {
        setThreads(await getDmThreads(user.id));
      } catch (err) {
        console.error("DM threads error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  async function refreshThreads(uid: string) {
    try {
      setThreads(await getDmThreads(uid));
    } catch (err) {
      console.error("DM threads error:", err);
    }
  }

  // Seçili partner: profil + mesajlar + okundu işaretle
  useEffect(() => {
    if (!userId || !partner) {
      setPartnerProfile(null);
      setMessages([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const [prof, msgs] = await Promise.all([
        getProfile(partner),
        getDmMessages(userId, partner),
      ]);
      if (cancelled) return;
      setPartnerProfile(prof);
      setMessages(msgs);
      await markDmRead(userId, partner);
      await refreshThreads(userId);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, partner]);

  // Realtime: bana gelen yeni DM'ler
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`dm:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${userId}`,
        },
        async (payload) => {
          const msg = payload.new as DirectMessage;
          if (partner && msg.sender_id === partner) {
            setMessages((prev) => [...prev, msg]);
            await markDmRead(userId, partner);
          }
          await refreshThreads(userId);
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [userId, partner]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!userId || !partner || !text.trim()) return;
    const body = text;
    setText("");
    try {
      await sendDirectMessage(userId, partner, body);
      setMessages(await getDmMessages(userId, partner));
      await refreshThreads(userId);
    } catch (err) {
      console.error("Send DM error:", err);
      toast.error(t("dm.sendError") || "Could not send message");
      setText(body);
    }
  }

  async function handleSendMedia(m: RecordedMedia) {
    if (!userId || !partner) return;
    setMediaUploading(true);
    try {
      const url = await uploadChatMedia(userId, m.blob, m.type, m.ext);
      await sendDirectMessage(userId, partner, "", { url, type: m.type, duration: m.duration });
      setMessages(await getDmMessages(userId, partner));
      await refreshThreads(userId);
    } catch (err) {
      console.error("Send DM media error:", err);
      toast.error(t("chat.uploadError") || "Could not send media");
    } finally {
      setMediaUploading(false);
    }
  }

  function timeLabel(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString())
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const partnerName = partnerProfile?.full_name || partnerProfile?.username || t("dm.aFriend") || "Friend";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/auth/profile"
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <h1 className="flex items-center gap-2 font-serif text-2xl text-foreground">
          <MessageCircle className="h-6 w-6 text-accent" /> {t("dm.title") || "Messages"}
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Konuşma listesi */}
        <div className={`space-y-2 ${partner ? "hidden lg:block" : ""}`}>
          {threads.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              {t("dm.empty") || "No conversations yet. Message a friend to start."}
            </p>
          ) : (
            threads.map((th) => (
              <Link
                key={th.partner_id}
                to="/auth/messages"
                search={{ partner: th.partner_id }}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  partner === th.partner_id
                    ? "border-accent bg-secondary"
                    : "border-border bg-card hover:bg-secondary/40"
                }`}
              >
                {th.avatar_url ? (
                  <img src={th.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary text-accent">
                    <User className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {th.full_name || th.username || t("dm.aFriend") || "Friend"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {th.last_sender === userId ? `${t("dm.you") || "You"}: ` : ""}
                    {th.last_content || (th.last_media_type ? t("dm.media") || "Media" : "")}
                  </p>
                </div>
                {th.unread > 0 && (
                  <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-xs font-medium text-accent-foreground">
                    {th.unread}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>

        {/* Sohbet paneli */}
        <div className={`flex flex-col ${!partner ? "hidden lg:flex" : ""}`}>
          {partner ? (
            <>
              {/* Partner başlığı — geri butonu ve profil linki kardeş (iç içe <a> olmaz) */}
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
                <Link
                  to="/auth/messages"
                  search={{}}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-secondary lg:hidden"
                  aria-label={t("dm.back") || "Back"}
                >
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </Link>
                <Link
                  to="/auth/user/$userId"
                  params={{ userId: partner }}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:opacity-80"
                >
                  {partnerProfile?.avatar_url ? (
                    <img src={partnerProfile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-accent">
                      <User className="h-4 w-4" />
                    </span>
                  )}
                  <span className="truncate text-sm font-medium">{partnerName}</span>
                </Link>
              </div>

              {/* Mesajlar */}
              <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 min-h-[320px] max-h-[460px]">
                {messages.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    {t("dm.startHint") || "Say hello 🌿"}
                  </p>
                ) : (
                  messages.map((msg) => {
                    const mine = msg.sender_id === userId;
                    return (
                      <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                          }`}
                        >
                          {msg.media_url && msg.media_type === "image" && (
                            <a href={msg.media_url} target="_blank" rel="noopener noreferrer">
                              <img src={msg.media_url} alt="" className="mt-1 max-h-64 w-full rounded-xl object-cover" />
                            </a>
                          )}
                          {msg.media_url && msg.media_type === "audio" && (
                            <audio controls src={msg.media_url} className="mt-1 w-56 max-w-full" />
                          )}
                          {msg.media_url && msg.media_type === "video" && (
                            <video controls playsInline src={msg.media_url} className="mt-1 max-h-72 w-full rounded-xl bg-black" />
                          )}
                          {msg.content && <p className="text-sm break-words">{msg.content}</p>}
                          <p className="mt-0.5 text-[10px] opacity-60">{timeLabel(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Composer */}
              <div className="mt-3 flex gap-2">
                <ChatMediaBar busy={mediaUploading} onSend={handleSendMedia} />
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={t("dm.placeholder") || "Write a message…"}
                  className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                />
                <button
                  onClick={handleSend}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border bg-card">
              <div className="text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("dm.selectThread") || "Select a conversation"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
