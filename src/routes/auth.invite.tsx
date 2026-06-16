import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Gift, Copy, Check, Share2, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  getMyReferralCode,
  getMyReferrals,
  type ReferralEntry,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/invite")({
  head: () => ({
    meta: [
      { title: "Invite friends — The Villageless Mama" },
      { name: "description", content: "Invite mothers to the village." },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const t = useT();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      try {
        const [c, list] = await Promise.all([
          getMyReferralCode(),
          getMyReferrals(user.id),
        ]);
        if (!cancelled) {
          setCode(c);
          setReferrals(list);
        }
      } catch (err) {
        console.error("❌ Invite load error:", err);
        toast.error(t("common.error") || "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate, t]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = code ? `${origin}/auth/signup?ref=${code}` : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(t("invite.copied") || "Link copied 🌿");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("common.error") || "Something went wrong");
    }
  }

  async function shareLink() {
    const shareText = t("invite.shareText") || "Join me in the village — a gentle companion for postpartum.";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "The Villageless Mama", text: shareText, url: link });
      } catch {
        /* paylaşım iptal edildi */
      }
    } else {
      copyLink();
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
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/auth/profile"
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <h1 className="flex items-center gap-2 font-serif text-2xl text-foreground">
          <Gift className="h-6 w-6 text-accent" /> {t("invite.title") || "Invite friends"}
        </h1>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        {t("invite.desc") ||
          "Share your link with mothers who'd feel at home here. When they join, you'll both grow the village."}
      </p>

      {/* Link card */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("invite.yourLink") || "Your invite link"}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none"
          />
          <div className="flex shrink-0 gap-2">
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t("invite.copiedShort") || "Copied" : t("invite.copy") || "Copy"}
            </button>
            <button
              onClick={shareLink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
            >
              <Share2 className="h-4 w-4" /> {t("invite.share") || "Share"}
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {t("invite.codeLabel") || "Your code"}:{" "}
          <span className="font-mono font-medium text-foreground">{code}</span>
        </p>
      </div>

      {/* Ödül kilometre taşları */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {t("invite.rewards") || "Rewards"}
        </h2>
        {(() => {
          const count = referrals.length;
          const milestones = [
            { n: 1, key: "first_invite", icon: "🌱" },
            { n: 3, key: "village_builder", icon: "🏡" },
            { n: 5, key: "village_founder", icon: "🌟" },
          ];
          const next = milestones.find((m) => count < m.n);
          const pct = next ? Math.min(100, Math.round((count / next.n) * 100)) : 100;
          return (
            <div className="rounded-2xl border border-border bg-card p-5">
              {/* İlerleme */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {count} {t("invite.invitesLabel") || "invites"}
                  </span>
                  {next && (
                    <span>
                      {t("invite.nextAt") || "Next reward at"} {next.n}
                    </span>
                  )}
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              {/* Rozetler */}
              <div className="grid grid-cols-3 gap-2">
                {milestones.map((m) => {
                  const earned = count >= m.n;
                  return (
                    <div
                      key={m.key}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-colors ${
                        earned ? "border-accent/40 bg-accent/5" : "border-border opacity-60"
                      }`}
                    >
                      <span className="text-2xl">{earned ? m.icon : <Lock className="h-5 w-5 text-muted-foreground" />}</span>
                      <span className="text-[11px] font-medium leading-tight">
                        {t(`invite.badge.${m.key}`) || m.key}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{m.n}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Invited list */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {t("invite.joined") || "Joined through you"} ({referrals.length})
        </h2>
        {referrals.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("invite.empty") || "No one yet. Share your link to welcome the first mother."}
          </p>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                {r.profiles?.avatar_url ? (
                  <img src={r.profiles.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-accent">
                    <User className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.profiles?.full_name || r.profiles?.username || t("invite.aMother") || "A mother"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
