import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Radio, Video, BadgeCheck, Eye, User } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  getProfile,
  getLiveStreams,
  type LiveStream,
  type Profile,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/live")({
  head: () => ({
    meta: [
      { title: "Live — The Villageless Mama" },
      { name: "description", content: "Live sessions from mothers and verified experts." },
    ],
  }),
  component: LivePage,
});

export function canGoLive(p: Profile | null): boolean {
  if (!p) return false;
  return p.membership_type === "gold" || p.is_admin === true || p.is_verified_expert === true;
}

function LivePage() {
  const t = useT();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      const [list, p] = await Promise.all([getLiveStreams(), getProfile(user.id)]);
      if (cancelled) return;
      setStreams(list);
      setProfile(p);
      setLoading(false);
    })();

    // Canlı listesi: yayın aç/kapa olunca tazele
    const channel = supabase
      .channel("live-streams-discovery")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_streams" }, () => {
        getLiveStreams().then(setStreams);
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGoLive() {
    if (!canGoLive(profile)) {
      toast.error(t("live.notEligible") || "Only Gold members and verified experts can go live yet.");
      return;
    }
    navigate({ to: "/auth/golive" });
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-2 flex items-center gap-3">
        <Link to="/auth/profile" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <h1 className="flex items-center gap-2 font-serif text-2xl text-foreground">
          <Radio className="h-5 w-5 text-accent" /> {t("live.title") || "Live"}
        </h1>
      </div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("live.subtitle") || "Live sessions from mothers and verified experts."}
        </p>
        <button
          onClick={handleGoLive}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Video className="h-4 w-4" /> {t("live.goLive") || "Go live"}
        </button>
      </div>

      {streams.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {t("live.empty") || "No one is live right now. Be the first 🌿"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {streams.map((s) => (
            <Link
              key={s.id}
              to="/auth/watch/$streamId"
              params={{ streamId: s.id }}
              className="group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-accent"
            >
              <div className="relative flex aspect-video items-center justify-center bg-secondary/40">
                <Radio className="h-8 w-8 text-accent/50" />
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                  ● {t("live.liveBadge") || "LIVE"}
                </span>
                <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">
                  <Eye className="h-3 w-3" /> {s.viewer_count}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3">
                {s.profiles?.avatar_url ? (
                  <img src={s.profiles.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary text-accent">
                    <User className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.title}</p>
                  <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                    {s.profiles?.full_name || s.profiles?.username || "Anonymous"}
                    {s.profiles?.is_verified_expert && (
                      <BadgeCheck className="h-3 w-3 text-accent" />
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 border-t border-border pt-4 text-center">
        <Link
          to="/auth/expert"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent"
        >
          <BadgeCheck className="h-3.5 w-3.5" /> {t("live.becomeExpert") || "Are you a professional? Get verified"}
        </Link>
      </div>
    </div>
  );
}
