import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogIn, Mail, Lock, ArrowLeft } from "lucide-react";
import { useT } from "@/lib/i18n";
import { signIn } from "@/lib/auth";
import { loginSchema, type LoginFormData } from "@/lib/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Log in — The Villageless Mama" },
      { name: "description", content: "Log in to your quiet space." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const t = useT();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      const result = await signIn(data.email, data.password);
      if (result.user) {
        navigate({ to: "/auth/profile" });
      } else {
        setError("root", { message: t("auth.loginError") });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("❌ Login hatası:", err);
      // Use translated error messages
      if (message.includes("Email not confirmed") || message.includes("email_not_confirmed")) {
        setError("root", { message: t("auth.emailNotConfirmed") });
      } else if (message.includes("Invalid login credentials")) {
        setError("root", { message: t("auth.loginError") });
      } else {
        setError("root", { message: t("auth.loginError") });
      }
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 pt-12">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("nav.home")}
      </Link>

      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="mb-6 flex justify-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-accent">
            <LogIn className="h-7 w-7" />
          </div>
        </div>

        <h1 className="text-center font-serif text-2xl">{t("auth.loginTitle")}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t("auth.loginDesc")}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("auth.email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                {...register("email")}
                type="email"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-accent"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("auth.password")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                {...register("password")}
                type="password"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-accent"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{errors.root.message}</p>
          )}

          <div className="flex justify-end">
            <Link
              to="/auth/reset-password"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-accent"
            >
              {t("auth.forgotPassword")}
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "..." : t("auth.login")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link to="/auth/signup" className="text-accent underline underline-offset-4">
            {t("auth.signup")}
          </Link>
        </p>
      </div>
    </div>
  );
}
