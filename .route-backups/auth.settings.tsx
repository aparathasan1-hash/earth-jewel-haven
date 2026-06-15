import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Settings, Loader2, Bell } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/settings")({
  head: () => ({
    meta: [
      { title: "Settings — The Villageless Mama" },
      { name: "description", content: "Manage your preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const t = useT();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    loadPreferences().then(() => {
      if (!cancelled) setLoading(false);
    }).catch((err) => {
      if (!cancelled) {
        console.error("❌ Settings yüklenirken hata:", err);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function loadPreferences() {
    const user = await getCurrentUser();
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    setUserId(user.id);
    const prefs = await getNotificationPreferences(user.id);
    setPreferences(prefs);
  }

  async function handleToggle(key: keyof NotificationPreferences) {
    if (!preferences || !userId) return;

    const updated = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(updated);

    setSaving(true);
    try {
      await updateNotificationPreferences(userId, {
        [key]: !preferences[key],
      });
      toast.success(t("settings.saved") || "Settings saved");
    } catch (err) {
      console.error("❌ Settings kaydetme hatası:", err);
      toast.error(t("settings.saveError") || "Could not save settings");
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">{t("common.error") || "Error loading settings"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link
              to="/auth/profile"
              className="flex items-center justify-center h-8 w-8 rounded-lg hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </Link>
            <h1 className="flex items-center gap-2 font-serif text-2xl text-foreground">
              <Settings className="h-6 w-6 text-accent" /> {t("settings.title") || "Settings"}
            </h1>
          </div>
        </div>

        {/* Notifications Section */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-serif text-lg text-foreground mb-6">
            <Bell className="h-5 w-5 text-accent" /> {t("settings.notifications") || "Notifications"}
          </h2>

          <div className="space-y-6">
            {/* Email Daily Reminder Toggle */}
            <div className="flex items-start justify-between pb-6 border-b border-border/50">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_daily_reminder}
                    onChange={() => handleToggle("email_daily_reminder")}
                    disabled={saving}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  {t("settings.dailyReminder") || "Daily Reminder"}
                </label>
                <p className="mt-2 text-xs text-muted-foreground ml-6">
                  {t("settings.dailyReminderDesc") || "Get an email each morning to check in on your mood"}
                </p>
              </div>
            </div>

            {/* Email Weekly Summary Toggle */}
            <div className="flex items-start justify-between pb-6 border-b border-border/50">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_weekly_summary}
                    onChange={() => handleToggle("email_weekly_summary")}
                    disabled={saving}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  {t("settings.weeklySummary") || "Weekly Summary"}
                </label>
                <p className="mt-2 text-xs text-muted-foreground ml-6">
                  {t("settings.weeklySummaryDesc") || "Receive a summary of your week every Sunday"}
                </p>
              </div>
            </div>

            {/* Push Notifications Toggle */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.push_notifications}
                    onChange={() => handleToggle("push_notifications")}
                    disabled={saving}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  {t("settings.pushNotifications") || "Push Notifications"}
                </label>
                <p className="mt-2 text-xs text-muted-foreground ml-6">
                  {t("settings.pushNotificationsDesc") || "Allow browser notifications for real-time updates"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {saving && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.saving") || "Saving..."}
          </div>
        )}
      </div>
    </div>
  );
}
