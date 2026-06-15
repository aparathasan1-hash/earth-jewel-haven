import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, ArrowRight, ArrowLeft, Check, Heart } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  getProfile,
  updateProfile,
  updateOnboarding,
  getOnboardingState,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/onboarding")({
  head: () => ({
    meta: [{ title: "Welcome — The Villageless Mama" }],
  }),
  component: OnboardingPage,
});

const INTEREST_KEYS = [
  { id: "feeding", fallback: "Feeding" },
  { id: "sleep", fallback: "Sleep" },
  { id: "mental_health", fallback: "Mental health" },
  { id: "relationship", fallback: "Relationship" },
  { id: "recovery", fallback: "Recovery" },
  { id: "community", fallback: "Community" },
];

function OnboardingPage() {
  const t = useT();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);

  // Form state
  const [fullName, setFullName] = useState("");
  const [babyName, setBabyName] = useState("");
  const [babyBirthDate, setBabyBirthDate] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [city, setCity] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      if (cancelled) return;
      // Zaten tamamladıysa profile yönlendir
      const state = await getOnboardingState(user.id);
      if (state.onboarded) {
        navigate({ to: "/auth/profile" });
        return;
      }
      const profile = await getProfile(user.id);
      if (cancelled) return;
      setUserId(user.id);
      setFullName(profile?.full_name ?? "");
      setBabyName(profile?.baby_name ?? "");
      setBabyBirthDate(profile?.baby_birth_date ?? "");
      setCity(state.city ?? "");
      setInterests(state.interests ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = [
    { titleKey: "onboarding.step1Title", fallback: "Welcome 🌿" },
    { titleKey: "onboarding.step2Title", fallback: "About your baby" },
    { titleKey: "onboarding.step3Title", fallback: "What matters to you" },
    { titleKey: "onboarding.step4Title", fallback: "Find mothers near you" },
  ];

  function toggleInterest(id: string) {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function next() {
    if (step < steps.length - 1) setStep((s) => s + 1);
  }
  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  async function finish() {
    if (!userId) return;
    setSaving(true);
    try {
      await updateProfile(userId, {
        full_name: fullName.trim() || null,
        baby_name: babyName.trim() || null,
        baby_birth_date: babyBirthDate || null,
      });
      await updateOnboarding(userId, {
        city: city.trim() || null,
        interests,
        onboarded: true,
      });
      toast.success(t("onboarding.done") || "All set 🌿");
      navigate({ to: "/auth/profile" });
    } catch (err) {
      console.error("❌ Onboarding error:", err);
      toast.error(t("onboarding.error") || "Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function skip() {
    if (!userId) return;
    try {
      await updateOnboarding(userId, { onboarded: true });
    } catch {
      /* best-effort */
    }
    navigate({ to: "/auth/profile" });
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-accent" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="font-serif text-3xl text-foreground">
            {t(steps[step].titleKey) || steps[step].fallback}
          </h1>

          {/* Step 0 — Welcome / name */}
          {step === 0 && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("onboarding.step1Desc") ||
                  "Let's set up your sanctuary. This takes less than a minute."}
              </p>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">
                  {t("onboarding.yourName") || "Your name"}
                </span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("onboarding.yourNamePlaceholder") || "How should we call you?"}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
            </div>
          )}

          {/* Step 1 — Baby */}
          {step === 1 && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("onboarding.step2Desc") ||
                  "We'll use this for your postpartum counter and to match you with mothers at the same stage."}
              </p>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">
                  {t("onboarding.babyName") || "Baby's name (optional)"}
                </span>
                <input
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">
                  {t("onboarding.babyBirthDate") || "Baby's birth date"}
                </span>
                <input
                  type="date"
                  value={babyBirthDate}
                  onChange={(e) => setBabyBirthDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
            </div>
          )}

          {/* Step 2 — Interests */}
          {step === 2 && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("onboarding.step3Desc") ||
                  "Pick what you'd like support with. We'll tailor your space."}
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_KEYS.map((it) => {
                  const active = interests.includes(it.id);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => toggleInterest(it.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-colors ${
                        active
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-foreground hover:border-accent"
                      }`}
                    >
                      {active && <Check className="h-3.5 w-3.5" />}
                      {t(`onboarding.interest.${it.id}`) || it.fallback}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3 — City */}
          {step === 3 && (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("onboarding.step4Desc") ||
                  "Optionally share your city to discover mothers nearby. Only your city is used — never your exact location."}
              </p>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">
                  {t("onboarding.city") || "City (optional)"}
                </span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("onboarding.cityPlaceholder") || "e.g. Istanbul"}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="mt-8 flex items-center justify-between gap-3">
        {step > 0 ? (
          <button
            onClick={back}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> {t("onboarding.back") || "Back"}
          </button>
        ) : (
          <button
            onClick={skip}
            className="text-sm text-muted-foreground hover:underline"
          >
            {t("onboarding.skip") || "Skip for now"}
          </button>
        )}

        {step < steps.length - 1 ? (
          <button
            onClick={next}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {t("onboarding.next") || "Next"} <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
            {t("onboarding.finish") || "Enter"}
          </button>
        )}
      </div>
    </div>
  );
}
