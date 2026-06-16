import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — The Villageless Mama" },
      { name: "description", content: "Reset your password." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const t = useT();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(t("auth.passwordResetError"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-md px-5 pt-12">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("nav.home")}
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-accent">
              <Send className="h-7 w-7" />
            </div>
          </div>
          <h1 className="font-serif text-2xl">{t("auth.resetSent")}</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("auth.resetPasswordDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-12">
      <Link
        to="/auth/login"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("auth.login")}
      </Link>

      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 flex justify-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-accent">
            <Mail className="h-7 w-7" />
          </div>
        </div>

        <h1 className="text-center font-serif text-2xl">{t("auth.resetPassword")}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t("auth.resetPasswordDesc")}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("auth.email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-accent"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : t("auth.resetPassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
