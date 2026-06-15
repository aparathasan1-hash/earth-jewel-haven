import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { UserPlus, Mail, Lock, ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { signUp, redeemReferral } from "@/lib/auth";
import { signUpSchema, type SignUpFormData } from "@/lib/validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export const Route = createFileRoute("/auth/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — The Villageless Mama" },
      { name: "description", content: "Join the village." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const t = useT();
  const navigate = useNavigate();

  // Davet linkinden gelen ?ref kodunu sakla (giriş sonrası kullanılır).
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) localStorage.setItem("pending_referral", ref.trim());
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
    },
  });

  async function onSubmit(data: SignUpFormData) {
    try {
      const result = await signUp(data.email, data.password, data.fullName);
      if (result.user && !result.session) {
        toast.success(t("auth.checkEmail") || "Please check your email to confirm your account before logging in.");
        navigate({ to: "/auth/login" });
      } else {
        // Oturum hazır → varsa davet kodunu hemen kullan (en iyi çaba).
        const code = localStorage.getItem("pending_referral");
        if (code) {
          localStorage.removeItem("pending_referral");
          try {
            await redeemReferral(code);
          } catch {
            /* best-effort */
          }
        }
        navigate({ to: "/auth/profile" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("❌ SignUp form hatası:", err);
      // Use translated error messages
      if (message.includes("already registered") || message.includes("already exists")) {
        setError("root", { message: t("auth.emailInUse") });
      } else if (message.includes("Password should be at least")) {
        setError("root", { message: t("auth.passwordTooShort") || "Password must be at least 6 characters" });
      } else {
        setError("root", { message: t("auth.signupError") });
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
            <UserPlus className="h-7 w-7" />
          </div>
        </div>

        <h1 className="text-center font-serif text-2xl">{t("auth.signupTitle")}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t("auth.signupDesc")}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          {/* Full Name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("auth.name")}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                {...register("fullName")}
                type="text"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-accent"
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
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

          {/* Password */}
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

          {/* Confirm Password */}
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("auth.confirmPassword")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                {...register("confirmPassword")}
                type="password"
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none focus:border-accent"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Root error (API errors) */}
          {errors.root && (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{errors.root.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "..." : t("auth.signup")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <Link to="/auth/login" className="text-accent underline underline-offset-4">
            {t("auth.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
