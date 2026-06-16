import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Crown, Check, BookOpen, Headphones, GraduationCap, Radio } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { redirectToCheckout } from "@/lib/stripe";

export const Route = createFileRoute("/auth/gold")({
  head: () => ({
    meta: [
      { title: "Gold membership — The Villageless Mama" },
      { name: "description", content: "Unlock the full vault, premium audio, and courses." },
    ],
  }),
  component: GoldPage,
});

function GoldPage() {
  const t = useT();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGold, setIsGold] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      setUserId(user.id);
      const profile = await getProfile(user.id);
      setIsGold(profile?.membership_type === "gold");
      setLoading(false);
    })();
  }, [navigate]);

  async function handleUpgrade() {
    if (!userId) return;
    setBusy(true);
    try {
      await redirectToCheckout(userId);
      // Başarılıysa Stripe'a yönlenir; buraya dönerse yönlenme olmadı demektir.
    } catch (err) {
      console.warn("Gold checkout not available:", err);
      toast.error(
        t("gold.notConfigured") ||
          "Gold checkout isn't available yet. Please check back soon 🌿"
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const perks = [
    { icon: BookOpen, key: "perkVault", fallback: "Full vault — every essay & printable" },
    { icon: Headphones, key: "perkAudio", fallback: "Premium guided audio" },
    { icon: GraduationCap, key: "perkCourses", fallback: "Slow courses (Matrescence & more)" },
    { icon: Radio, key: "perkLive", fallback: "Go live and host sessions" },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/auth/profile"
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <h1 className="flex items-center gap-2 font-serif text-2xl text-foreground">
          <Crown className="h-6 w-6 text-amber-500" /> {t("gold.title") || "Gold membership"}
        </h1>
      </div>

      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-6">
        <p className="text-sm text-muted-foreground">
          {t("gold.intro") ||
            "Support this quiet village and unlock its deepest rooms. Cancel anytime."}
        </p>

        <ul className="mt-5 space-y-3">
          {perks.map((p) => (
            <li key={p.key} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <p.icon className="h-4 w-4" />
              </span>
              <span className="text-sm text-foreground">{t(`gold.${p.key}`) || p.fallback}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          {isGold ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/15 py-3 text-sm font-medium text-amber-700 dark:text-amber-300">
              <Check className="h-4 w-4" /> {t("gold.alreadyGold") || "You're a Gold member 🌿"}
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
              {t("gold.upgradeCta") || "Become Gold"}
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {t("gold.secureNote") || "Payments are processed securely by Stripe."}
      </p>
    </div>
  );
}
