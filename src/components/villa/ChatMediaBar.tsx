import { useRef, useState, useEffect } from "react";
import { Image as ImageIcon, Mic, Video, Square, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import type { ChatMediaType } from "@/lib/auth";

const MAX_SECONDS = 60;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export type RecordedMedia = {
  blob: Blob;
  type: ChatMediaType;
  ext: string;
  duration?: number;
};

type Mode = "idle" | "audio" | "video";

function pickMime(kind: "audio" | "video"): { mime: string; ext: string } {
  const candidates =
    kind === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  const MR = typeof window !== "undefined" ? window.MediaRecorder : undefined;
  for (const c of candidates) {
    if (MR && MR.isTypeSupported && MR.isTypeSupported(c)) {
      return { mime: c, ext: c.includes("mp4") ? "mp4" : c.includes("ogg") ? "ogg" : "webm" };
    }
  }
  return { mime: "", ext: kind === "video" ? "mp4" : "webm" };
}

export function ChatMediaBar({
  disabled,
  busy,
  onSend,
}: {
  disabled?: boolean;
  busy?: boolean;
  onSend: (m: RecordedMedia) => Promise<void> | void;
}) {
  const t = useT();
  const [mode, setMode] = useState<Mode>("idle");
  const [elapsed, setElapsed] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const discardRef = useRef(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const elapsedRef = useRef(0); // onstop closure'ında güncel süreyi okumak için

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => () => cleanupStream(), []);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("chat.notImage") || "Please choose an image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(t("chat.tooLarge") || "Image is too large (max 10MB).");
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    void onSend({ blob: file, type: "image", ext });
  }

  async function startRecording(kind: "audio" | "video") {
    if (disabled || busy) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === "video" ? { video: { facingMode: "user" }, audio: true } : { audio: true }
      );
      streamRef.current = stream;
      discardRef.current = false;
      chunksRef.current = [];
      const { mime, ext } = pickMime(kind);
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      rec.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        const duration = elapsedRef.current;
        cleanupStream();
        setMode("idle");
        setElapsed(0);
        if (discardRef.current) return;
        const blob = new Blob(chunksRef.current, { type: mime || undefined });
        if (blob.size === 0) return;
        void onSend({ blob, type: kind, ext, duration });
      };
      rec.start();
      setMode(kind);
      setElapsed(0);
      elapsedRef.current = 0;
      timerRef.current = setInterval(() => {
        setElapsed((s) => {
          const next = s + 1;
          elapsedRef.current = next;
          if (next >= MAX_SECONDS) stopRecording(false);
          return next;
        });
      }, 1000);

      if (kind === "video") {
        // Canlı önizleme
        setTimeout(() => {
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
            videoPreviewRef.current.play().catch(() => {});
          }
        }, 50);
      }
    } catch (err) {
      console.error("getUserMedia error:", err);
      cleanupStream();
      setMode("idle");
      toast.error(t("chat.permissionDenied") || "Microphone/camera access was denied.");
    }
  }

  function stopRecording(discard: boolean) {
    discardRef.current = discard;
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    else {
      cleanupStream();
      setMode("idle");
      setElapsed(0);
    }
  }

  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePick}
      />

      {/* Tetikleyici butonlar */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || busy}
        title={t("chat.photo") || "Photo"}
        aria-label={t("chat.photo") || "Photo"}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-50"
      >
        <ImageIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => startRecording("audio")}
        disabled={disabled || busy}
        title={t("chat.voice") || "Voice message"}
        aria-label={t("chat.voice") || "Voice message"}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-50"
      >
        <Mic className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => startRecording("video")}
        disabled={disabled || busy}
        title={t("chat.video") || "Video"}
        aria-label={t("chat.video") || "Video"}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-50"
      >
        <Video className="h-5 w-5" />
      </button>

      {/* Kayıt paneli (alt sabit) */}
      {mode !== "idle" && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-24 sm:pb-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-xl">
            {mode === "video" && (
              <video
                ref={videoPreviewRef}
                muted
                playsInline
                className="mb-3 aspect-video w-full rounded-xl bg-black object-cover"
              />
            )}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                {mode === "audio" ? t("chat.recordingAudio") || "Recording…" : t("chat.recordingVideo") || "Recording…"}
              </span>
              <span className="font-mono text-sm text-muted-foreground">{mmss}</span>
              <span className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => stopRecording(true)}
                  title={t("chat.cancel") || "Cancel"}
                  aria-label={t("chat.cancel") || "Cancel"}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => stopRecording(false)}
                  disabled={busy}
                  title={t("chat.sendRecording") || "Send"}
                  aria-label={t("chat.sendRecording") || "Send"}
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Square className="h-5 w-5" />}
                </button>
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("chat.maxLen") || "Up to 60 seconds."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
