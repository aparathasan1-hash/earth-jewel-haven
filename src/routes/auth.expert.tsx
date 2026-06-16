import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, BadgeCheck, Upload, Clock, XCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  getProfile,
  getMyExpertApplication,
  submitExpertApplication,
  type ExpertApplication,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/expert")({
  head: () => ({ meta: [{ title: "Expert Verification — The Villageless Mama" }] }),
  component: ExpertPage,
});

function ExpertPage() {
  const t = useT();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [alreadyExpert, setAlreadyExpert] = useState(false);
  const [app, setApp] = useState<ExpertApplication | null>(null);
  const [fullName, setFullName] = useState("");
  const [profession, setProfession] = useState("");
  const [expertTitle, setExpertTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      const [p, a] = await Promise.all([getProfile(user.id), getMyExpertApplication(user.id)]);
      if (cancelled) return;
      setUserId(user.id);
      setAlreadyExpert(!!p?.is_verified_expert);
      setApp(a);
      setFullName(p?.full_name ?? "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit() {
    if (!userId || !fullName.trim() || !profession.trim() || !file) {
      toast.error(t("expert.missing") || "Please fill all fields and attach a document.");
      return;
    }
    setSubmitting(true);
    try {
      await submitExpertApplication(
        userId,
        { fullName: fullName.trim(), profession: profession.trim(), expertTitle: expertTitle.trim() || undefined },
        file
      );
      toast.success(t("expert.submitted") || "Application sent for review 🌿");
      const a = await getMyExpertApplication(userId);
      setApp(a);
    } catch (err) {
      console.error("❌ Expert application error:", err);
      toast.error(t("expert.error") || "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const canReapply = !app || app.status === "rejected";

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-4 flex items-center gap-3">
        <Link to="/auth/profile" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <h1 className="flex items-center gap-2 font-serif text-2xl">
          <ShieldCheck className="h-5 w-5 text-accent" /> {t("expert.title") || "Expert verification"}
        </h1>
      </div>

      {alreadyExpert ? (
        <div className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-5">
          <BadgeCheck className="h-8 w-8 text-accent" />
          <div>
            <p className="font-medium">{t("expert.verified") || "You're a verified expert 🌿"}</p>
            <p className="text-sm text-muted-foreground">
              {t("expert.verifiedDesc") || "Your badge appears across the app and on your streams."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-muted-foreground">
            {t("expert.intro") ||
              "Are you a doctor, midwife, psychologist or another professional? Send your credential and we'll review it. Verified experts get a badge and stand out on live streams."}
          </p>

          {/* Mevcut başvuru durumu */}
          {app && app.status === "pending" && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              {t("expert.pending") || "Your application is under review."}
            </div>
          )}
          {app && app.status === "rejected" && (
            <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <XCircle className="h-4 w-4 text-destructive" />
                {t("expert.rejected") || "Your application was not approved."}
              </p>
              {app.review_note && <p className="mt-1 text-muted-foreground">{app.review_note}</p>}
              <p className="mt-1 text-muted-foreground">{t("expert.reapply") || "You can apply again below."}</p>
            </div>
          )}

          {canReapply && (
            <div className="space-y-4">
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">{t("expert.fullName") || "Full name"}</span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">{t("expert.profession") || "Profession"}</span>
                <input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder={t("expert.professionPlaceholder") || "e.g. OB-GYN, Midwife, Psychologist"}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block text-muted-foreground">
                  {t("expert.displayTitle") || "Title to display (optional)"}
                </span>
                <input
                  value={expertTitle}
                  onChange={(e) => setExpertTitle(e.target.value)}
                  placeholder={t("expert.displayTitlePlaceholder") || "e.g. Dr."}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
                />
              </label>

              <div>
                <span className="mb-1.5 block text-sm text-muted-foreground">
                  {t("expert.document") || "Credential document (diploma, license)"}
                </span>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border bg-background px-3 py-3 text-sm text-muted-foreground hover:border-accent"
                >
                  <Upload className="h-4 w-4" />
                  {file ? file.name : t("expert.chooseFile") || "Choose file (image or PDF)"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {t("expert.privacyNote") ||
                    "Your document is stored privately and only seen by our review team."}
                </p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {t("expert.submit") || "Submit for review"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
