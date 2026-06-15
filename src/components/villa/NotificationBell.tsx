import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, UserPlus, Check, MessageCircle, Radio } from "lucide-react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/auth";

const ICONS = {
  friend_request: UserPlus,
  friend_accept: Check,
  room_message: MessageCircle,
  live_started: Radio,
} as const;

function timeAgo(iso: string, t: (k: string) => string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return t("notif.now") || "now";
  if (s < 3600) return `${Math.floor(s / 60)}${t("notif.min") || "m"}`;
  if (s < 86400) return `${Math.floor(s / 3600)}${t("notif.hour") || "h"}`;
  return `${Math.floor(s / 86400)}${t("notif.day") || "d"}`;
}

export function NotificationBell({ userId }: { userId: string }) {
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [list, count] = await Promise.all([getNotifications(userId), getUnreadCount(userId)]);
      if (cancelled) return;
      setItems(list);
      setUnread(count);
    }
    load();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as AppNotification;
          setItems((prev) => [n, ...prev].slice(0, 30));
          setUnread((c) => c + 1);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      await markAllNotificationsRead(userId).catch(() => {});
    }
  }

  function handleClick(n: AppNotification) {
    setOpen(false);
    if (n.link) navigate({ to: n.link });
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label={t("notif.title") || "Notifications"}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 max-h-[70vh] w-80 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl">
            <p className="px-3 py-2 text-sm font-medium">{t("notif.title") || "Notifications"}</p>
            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-muted-foreground">
                {t("notif.empty") || "No notifications yet 🌿"}
              </p>
            ) : (
              items.map((n) => {
                const Icon = ICONS[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-secondary/40 ${
                      n.read ? "" : "bg-secondary/30"
                    }`}
                  >
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-accent">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight">{n.title}</span>
                      {n.body && (
                        <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">{timeAgo(n.created_at, t)}</span>
                    </span>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
