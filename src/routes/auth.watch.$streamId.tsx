import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Send, Flag, BadgeCheck, Radio, User } from "lucide-react";
import { toast } from "sonner";
import { LiveKitRoom, VideoTrack, RoomAudioRenderer, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  getProfile,
  getStream,
  getStreamMessages,
  sendStreamMessage,
  reportStream,
  endStream,
  type LiveStream,
  type StreamMessage,
} from "@/lib/auth";
import { createLiveToken } from "@/lib/api/live.functions";

export const Route = createFileRoute("/auth/watch/$streamId")({
  head: () => ({ meta: [{ title: "Watching — The Villageless Mama" }] }),
  component: WatchPage,
});

// Host'un kamera görüntüsü (uzak katılımcı)
function HostVideo() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  const cam = tracks.find((t) => !t.participant.isLocal) ?? tracks[0];
  if (!cam) {
    return (
      <div className="flex aspect-video items-center justify-center bg-black text-sm text-white/60">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yayın yükleniyor…
      </div>
    );
  }
  return <VideoTrack trackRef={cam} className="aspect-video w-full bg-black object-contain" />;
}

function WatchPage() {
  const { streamId } = Route.useParams();
  const t = useT();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      const [s, prof] = await Promise.all([getStream(streamId), getProfile(user.id)]);
      if (cancelled) return;
      setUserId(user.id);
      setIsAdmin(!!prof?.is_admin);
      setStream(s);
      if (s && s.status === "live") {
        const [res, msgs] = await Promise.all([
          createLiveToken({ data: { streamId, identity: user.id, role: "viewer" } }),
          getStreamMessages(streamId),
        ]);
        if (cancelled) return;
        setMessages(msgs);
        if (res.configured) {
          setToken(res.token);
          setUrl(res.url);
        } else {
          setNotConfigured(true);
        }
      }
      setLoading(false);
    })();

    // Canlı sohbet + yayın durumu
    const chatChannel = supabase
      .channel(`stream_messages:${streamId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "stream_messages", filter: `stream_id=eq.${streamId}` },
        () => getStreamMessages(streamId).then(setMessages)
      )
      .subscribe();
    const statusChannel = supabase
      .channel(`stream_status:${streamId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_streams", filter: `id=eq.${streamId}` },
        (payload) => {
          const next = payload.new as LiveStream;
          setStream((prev) => (prev ? { ...prev, ...next } : next));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(statusChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const c = text.trim();
    if (!c || !userId) return;
    setText("");
    try {
      await sendStreamMessage(streamId, userId, c);
    } catch (err) {
      console.error("❌ Chat error:", err);
      toast.error(t("live.chatError") || "Could not send");
    }
  }

  async function handleAdminEnd() {
    if (!confirm(t("live.adminEndConfirm") || "End this stream as admin?")) return;
    try {
      await endStream(streamId, "admin");
      toast.success(t("live.adminEnded") || "Stream ended");
    } catch (err) {
      console.error("❌ Admin end error:", err);
      toast.error(t("live.adminEndError") || "Could not end stream");
    }
  }

  async function handleReport() {
    if (!userId) return;
    try {
      await reportStream(streamId, userId, "user_report");
      toast.success(t("live.reported") || "Reported. Thank you for keeping us safe.");
    } catch {
      toast.error(t("live.reportError") || "Could not report");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const ended = !stream || stream.status === "ended";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-3 flex items-center gap-3">
        <Link to="/auth/live" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-lg">{stream?.title || t("live.title") || "Live"}</p>
          <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            {stream?.profiles?.full_name || stream?.profiles?.username || "Anonymous"}
            {stream?.profiles?.is_verified_expert && <BadgeCheck className="h-3 w-3 text-accent" />}
          </p>
        </div>
        {!ended && (
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleAdminEnd}
                className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-xs font-medium text-white"
              >
                <Flag className="h-3.5 w-3.5" /> {t("live.adminEnd") || "End (admin)"}
              </button>
            )}
            <button
              onClick={handleReport}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive"
            >
              <Flag className="h-3.5 w-3.5" /> {t("live.report") || "Report"}
            </button>
          </div>
        )}
      </div>

      {/* Video alanı */}
      <div className="overflow-hidden rounded-2xl border border-border">
        {ended ? (
          <div className="flex aspect-video items-center justify-center bg-secondary/40 text-sm text-muted-foreground">
            {t("live.ended") || "This stream has ended."}
          </div>
        ) : notConfigured ? (
          <div className="flex aspect-video items-center justify-center bg-black text-center text-sm text-white/70">
            <span className="px-6">
              {t("live.notConfiguredViewer") ||
                "Live video isn't configured yet. Chat still works below."}
            </span>
          </div>
        ) : token && url ? (
          <LiveKitRoom serverUrl={url} token={token} connect audio={false} video={false}>
            <HostVideo />
            <RoomAudioRenderer />
          </LiveKitRoom>
        ) : (
          <div className="flex aspect-video items-center justify-center bg-black">
            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
          </div>
        )}
      </div>

      {/* Canlı sohbet */}
      <div className="mt-4 rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-medium">
          <Radio className="h-4 w-4 text-accent" /> {t("live.chat") || "Live chat"}
        </div>
        <div className="max-h-64 space-y-2 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              {t("live.chatEmpty") || "No messages yet. Say hello 🌿"}
            </p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex items-start gap-2 text-sm">
                {m.profiles?.avatar_url ? (
                  <img src={m.profiles.avatar_url} alt="" className="mt-0.5 h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-secondary text-accent">
                    <User className="h-3 w-3" />
                  </span>
                )}
                <p className="min-w-0">
                  <span className="mr-1 font-medium">
                    {m.profiles?.full_name || m.profiles?.username || "Anon"}
                  </span>
                  <span className="break-words text-muted-foreground">{m.content}</span>
                </p>
              </div>
            ))
          )}
          <div ref={endRef} />
        </div>
        {!ended && (
          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              maxLength={300}
              placeholder={t("live.chatPlaceholder") || "Write something gentle…"}
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
