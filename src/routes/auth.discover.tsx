import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, UserPlus, Check, MapPin, Heart, Baby, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useT, useLang } from "@/lib/i18n";
import {
  getCurrentUser,
  getProfile,
  discoverProfiles,
  sendConnectionRequest,
  calculatePostpartumDays,
  babyCohort,
  birthClubTitle,
  getOrCreateBirthClub,
  type DiscoverProfile,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/discover")({
  head: () => ({
    meta: [
      { title: "Discover — The Villageless Mama" },
      { name: "description", content: "Find mothers at the same stage as you." },
    ],
  }),
  component: DiscoverPage,
});

function babyAgeLabel(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const days = calculatePostpartumDays(birthDate);
  if (days == null || days < 0) return null;
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

function DiscoverPage() {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);
  const [cohort, setCohort] = useState<string | null>(null);
  const [joiningClub, setJoiningClub] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      if (cancelled) return;
      setUserId(user.id);
      try {
        const [list, profile] = await Promise.all([
          discoverProfiles(user.id),
          getProfile(user.id),
        ]);
        if (cancelled) return;
        setProfiles(list);
        if (profile?.baby_birth_date) setCohort(babyCohort(profile.baby_birth_date));
      } catch (err) {
        console.error("❌ Discover error:", err);
        toast.error(t("discover.error") || "Could not load suggestions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function enterBirthClub() {
    if (!userId || !cohort) return;
    setJoiningClub(true);
    try {
      const title = birthClubTitle(cohort, lang);
      const roomId = await getOrCreateBirthClub(userId, cohort, title);
      if (roomId) {
        navigate({ to: "/auth/community", search: { roomId } });
      }
    } catch (err) {
      console.error("❌ Birth club error:", err);
      toast.error(t("discover.clubError") || "Could not open your birth club");
    } finally {
      setJoiningClub(false);
    }
  }

  async function handleAdd(targetId: string) {
    if (!userId) return;
    setSending(targetId);
    try {
      await sendConnectionRequest(userId, targetId);
      setSent((prev) => new Set(prev).add(targetId));
      toast.success(t("discover.requestSent") || "Request sent");
    } catch (err) {
      console.error("❌ Connection error:", err);
      toast.error(t("discover.requestError") || "Could not send request");
    } finally {
      setSending(null);
    }
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
        <Link
          to="/auth/profile"
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <h1 className="font-serif text-2xl text-foreground">{t("discover.title") || "Discover"}</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("discover.subtitle") || "Mothers at a similar stage, near you, with shared interests."}
      </p>

      {/* Birth Club — doğum-ayı kohort grubu */}
      {cohort && (
        <button
          onClick={enterBirthClub}
          disabled={joiningClub}
          className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-left transition-colors hover:bg-accent/10 disabled:opacity-60"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
            <Users className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">
              {birthClubTitle(cohort, lang)}
            </span>
            <span className="block text-[12px] text-muted-foreground">
              {t("discover.clubSubtitle") || "Join mothers who gave birth the same month"}
            </span>
          </span>
          {joiningClub ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" />
          ) : (
            <ArrowRight className="h-4 w-4 shrink-0 text-accent" />
          )}
        </button>
      )}

      {profiles.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t("discover.empty") || "No suggestions yet. Check back soon."}
        </p>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => {
            const isSent = sent.has(p.id);
            const ageLabel = babyAgeLabel(p.baby_birth_date);
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <Link to="/auth/user/$userId" params={{ userId: p.id }} className="shrink-0">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-accent">
                      <Heart className="h-5 w-5" />
                    </span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/auth/user/$userId"
                    params={{ userId: p.id }}
                    className="text-sm font-medium hover:underline"
                  >
                    {p.full_name || p.username || "Anonymous"}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {ageLabel && (
                      <span className="inline-flex items-center gap-1">
                        <Baby className="h-3 w-3" /> {ageLabel}
                      </span>
                    )}
                    {p.same_city && p.city && (
                      <span className="inline-flex items-center gap-1 text-accent">
                        <MapPin className="h-3 w-3" /> {p.city}
                      </span>
                    )}
                    {p.shared_interests > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" />{" "}
                        {p.shared_interests} {t("discover.sharedInterests") || "shared"}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(p.id)}
                  disabled={isSent || sending === p.id}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60"
                >
                  {sending === p.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : isSent ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
                  )}
                  {isSent ? t("discover.sent") || "Sent" : t("discover.add") || "Connect"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
