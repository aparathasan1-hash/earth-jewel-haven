import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Radio, Video, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { LiveKitRoom, VideoTrack, useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useT } from "@/lib/i18n";
import { getCurrentUser, getProfile, startStream, endStream } from "@/lib/auth";
import { createLiveToken } from "@/lib/api/live.functions";
import { canGoLive } from "./auth.live";

export const Route = createFileRoute("/auth/golive")({
  head: () => ({ meta: [{ title: "Go Live — The Villageless Mama" }] }),
  component: GoLivePage,
});

// Yayıncının kendi kamera önizlemesi
function BroadcasterPreview() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
  const cam = tracks.find((t) => t.participant.isLocal);
  if (!cam) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-secondary/40 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kamera başlatılıyor…
      </div>
    );
  }
  return <VideoTrack trackRef={cam} className="aspect-video w-full rounded-2xl bg-black object-cover" />;
}

function GoLivePage() {
  const t = useT();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [eligible, setEligible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [title, setTitle] = useState("");
  const [starting, setStarting] = useState(false);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      const p = await getProfile(user.id);
      if (cancelled) return;
      setUserId(user.id);
      setEligible(canGoLive(p));
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStart() {
    if (!title.trim() || !userId) return;
    setStarting(true);
    try {
      const stream = await startStream(userId, title.trim());
      const res = await createLiveToken({
        data: { streamId: stream.id, identity: userId, role: "host" },
      });
      if (!res.configured) {
        // Anahtar yok → kaydı kapat, bilgilendir
        await endStream(stream.id, "host");
        setNotConfigured(true);
        return;
      }
      setStreamId(stream.id);
      setToken(res.token);
      setUrl(res.url);
      toast.success(t("live.started") || "You're live 🌿");
    } catch (err) {
      console.error("❌ Go live error:", err);
      toast.error(t("live.startError") || "Could not start the stream");
    } finally {
      setStarting(false);
    }
  }

  async function handleEnd() {
    if (!streamId) return;
    try {
      await endStream(streamId, "host");
    } catch (err) {
      console.error("❌ End stream error:", err);
    }
    navigate({ to: "/auth/live" });
  }

  if (checking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <h1 className="font-serif text-2xl">{t("live.notEligibleTitle") || "Not available yet"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("live.notEligible") || "Only Gold members and verified experts can go live yet."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => navigate({ to: "/auth/live" })}
            className="rounded-full border border-border px-5 py-2.5 text-sm"
          >
            {t("live.backToLive") || "Back to Live"}
          </button>
          <button
            onClick={() => navigate({ to: "/auth/expert" })}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {t("live.getVerified") || "Get verified as expert"}
          </button>
        </div>
      </div>
    );
  }

  // Yayın aktif: LiveKit odası
  if (streamId && token && url) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white">
            <Radio className="h-3.5 w-3.5" /> {t("live.liveBadge") || "LIVE"}
          </span>
          <button
            onClick={handleEnd}
            className="rounded-full bg-destructive px-5 py-2 text-sm font-medium text-white"
          >
            {t("live.end") || "End stream"}
          </button>
        </div>
        <LiveKitRoom serverUrl={url} token={token} connect video audio>
          <BroadcasterPreview />
        </LiveKitRoom>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {t("live.broadcasting") || "You are broadcasting. Be kind and stay safe."}
        </p>
      </div>
    );
  }

  // Başlangıç formu
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="flex items-center gap-2 font-serif text-2xl">
        <Video className="h-5 w-5 text-accent" /> {t("live.goLive") || "Go live"}
      </h1>

      {notConfigured && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <span className="text-muted-foreground">
            {t("live.notConfigured") ||
              "Live video is not configured yet (LIVEKIT keys missing). Add them to .env to broadcast."}
          </span>
        </div>
      )}

      <label className="mt-6 block text-sm">
        <span className="mb-1.5 block text-muted-foreground">{t("live.streamTitle") || "Stream title"}</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder={t("live.streamTitlePlaceholder") || "What's this session about?"}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
        />
      </label>

      <p className="mt-3 text-xs text-muted-foreground">
        {t("live.consent") ||
          "By going live you agree to our community guidelines. Streams may be moderated and ended by admins."}
      </p>

      <button
        onClick={handleStart}
        disabled={starting || !title.trim()}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
        {t("live.startNow") || "Start broadcasting"}
      </button>
    </div>
  );
}
