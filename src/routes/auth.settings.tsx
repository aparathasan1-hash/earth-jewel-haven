import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Settings, Loader2, Bell, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/auth";
import { subscribeToPush, unsubscribeFromPush, isPushSupported } from "@/lib/push";
import { sendTestPush } from "@/lib/api/push.functions";

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

  async function handleSelect(key: keyof NotificationPreferences, value: string) {
    if (!preferences || !userId) return;
    const prev = preferences;
    setPreferences({ ...preferences, [key]: value });
    setSaving(true);
    try {
      await updateNotificationPreferences(userId, { [key]: value });
      toast.success(t("settings.saved") || "Settings saved");
    } catch (err) {
      console.error("❌ Settings kaydetme hatası:", err);
      toast.error(t("settings.saveError") || "Could not save settings");
      setPreferences(prev);
    } finally {
      setSaving(false);
    }
  }

  async function handlePushToggle() {
    if (!preferences || !userId) return;
    const turningOn = !preferences.push_notifications;
    setSaving(true);
    try {
      if (turningOn) {
        if (!isPushSupported()) {
          toast.error(t("settings.pushUnsupported") || "Push not supported on this browser");
          return;
        }
        const ok = await subscribeToPush(userId);
        if (!ok) {
          toast.error(t("settings.pushDenied") || "Notification permission denied");
          return;
        }
      } else {
        await unsubscribeFromPush(userId);
      }
      await updateNotificationPreferences(userId, { push_notifications: turningOn });
      setPreferences({ ...preferences, push_notifications: turningOn });
      toast.success(t("settings.saved") || "Settings saved");
    } catch (err) {
      console.error("❌ Push toggle hatası:", err);
      toast.error(t("settings.saveError") || "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestPush() {
    if (!userId) return;
    try {
      const res = await sendTestPush({ data: { userId } });
      if (!res.configured) {
        toast.error(t("settings.pushNotConfigured") || "Push not configured on server yet");
      } else if (res.sent === 0) {
        toast.error(t("settings.pushNoDevices") || "No subscribed devices found");
      } else {
        toast.success(t("settings.pushSent") || "Test notification sent");
      }
    } catch (err) {
      console.error("❌ Test push hatası:", err);
      toast.error(t("common.error") || "Something went wrong");
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
                    onChange={handlePushToggle}
                    disabled={saving}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  {t("settings.pushNotifications") || "Push Notifications"}
                </label>
                <p className="mt-2 text-xs text-muted-foreground ml-6">
                  {t("settings.pushNotificationsDesc") || "Allow browser notifications for real-time updates"}
                </p>
                {preferences.push_notifications && (
                  <button
                    onClick={handleTestPush}
                    disabled={saving}
                    className="ml-6 mt-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-secondary/40 disabled:opacity-50"
                  >
                    {t("settings.sendTestPush") || "Send test notification"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-serif text-lg text-foreground mb-2">
            <ShieldCheck className="h-5 w-5 text-accent" /> {t("settings.privacy") || "Privacy"}
          </h2>
          <p className="mb-6 text-xs text-muted-foreground">
            {t("settings.privacyDesc") ||
              "Choose who can see your information. You're always in control."}
          </p>

          <div className="space-y-6">
            {/* Profile visibility */}
            <div className="pb-6 border-b border-border/50">
              <label className="text-sm font-medium text-foreground">
                {t("settings.profileVisibility") || "Profile visibility"}
              </label>
              <p className="mt-1 mb-2 text-xs text-muted-foreground">
                {t("settings.profileVisibilityDesc") || "Who can view your profile page"}
              </p>
              <select
                value={preferences.profile_visibility}
                onChange={(e) => handleSelect("profile_visibility", e.target.value)}
                disabled={saving}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              >
                <option value="public">{t("settings.visPublic") || "Everyone"}</option>
                <option value="friends">{t("settings.visFriends") || "Friends only"}</option>
                <option value="private">{t("settings.visPrivate") || "Only me (hidden)"}</option>
              </select>
            </div>

            {/* Baby info */}
            <VisibilityRow
              label={t("settings.showBabyInfo") || "Baby information"}
              desc={t("settings.showBabyInfoDesc") || "Baby name, birth date and photos"}
              value={preferences.show_baby_info}
              disabled={saving}
              onChange={(v) => handleSelect("show_baby_info", v)}
              t={t}
            />

            {/* Mood */}
            <VisibilityRow
              label={t("settings.showMood") || "Mood & wellbeing"}
              desc={t("settings.showMoodDesc") || "Your mood history and check-ins (very private)"}
              value={preferences.show_mood}
              disabled={saving}
              onChange={(v) => handleSelect("show_mood", v)}
              t={t}
            />

            {/* Activity */}
            <VisibilityRow
              label={t("settings.showActivity") || "Activity"}
              desc={t("settings.showActivityDesc") || "Breathing stats and activity"}
              value={preferences.show_activity}
              disabled={saving}
              onChange={(v) => handleSelect("show_activity", v)}
              t={t}
            />

            {/* Online status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.show_online_status}
                    onChange={() => handleToggle("show_online_status")}
                    disabled={saving}
                    className="w-4 h-4 rounded border-border cursor-pointer"
                  />
                  <Users className="h-4 w-4 text-accent" />
                  {t("settings.showOnlineStatus") || "Show online status"}
                </label>
                <p className="mt-2 text-xs text-muted-foreground ml-6">
                  {t("settings.showOnlineStatusDesc") || "Let others see when you're active"}
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

function VisibilityRow({
  label,
  desc,
  value,
  disabled,
  onChange,
  t,
}: {
  label: string;
  desc: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="pb-6 border-b border-border/50">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <p className="mt-1 mb-2 text-xs text-muted-foreground">{desc}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
      >
        <option value="everyone">{t("settings.visEveryone") || "Everyone"}</option>
        <option value="friends">{t("settings.visFriends") || "Friends only"}</option>
        <option value="none">{t("settings.visNone") || "No one"}</option>
      </select>
    </div>
  );
}
