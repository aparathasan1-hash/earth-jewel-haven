import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Check, X, UserMinus, Users, User, Gift, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  getFriends,
  getIncomingRequests,
  acceptConnectionRequest,
  removeConnection,
  type Profile,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/friends")({
  head: () => ({
    meta: [
      { title: "Friends — The Villageless Mama" },
      { name: "description", content: "Your connections." },
    ],
  }),
  component: FriendsPage,
});

type Row = { connectionId: string; profile: Profile };

function FriendsPage() {
  const t = useT();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [friends, setFriends] = useState<Row[]>([]);
  const [requests, setRequests] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      const [f, r] = await Promise.all([getFriends(user.id), getIncomingRequests(user.id)]);
      if (!cancelled) {
        setFriends(f);
        setRequests(r);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleAccept(row: Row) {
    setBusy(row.connectionId);
    try {
      await acceptConnectionRequest(row.connectionId);
      setRequests((prev) => prev.filter((x) => x.connectionId !== row.connectionId));
      setFriends((prev) => [row, ...prev]);
      toast.success(t("friends.accepted") || "Request accepted");
    } catch (err) {
      console.error(err);
      toast.error(t("common.error") || "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove(row: Row, isRequest: boolean) {
    setBusy(row.connectionId);
    try {
      await removeConnection(row.connectionId);
      if (isRequest) {
        setRequests((prev) => prev.filter((x) => x.connectionId !== row.connectionId));
      } else {
        setFriends((prev) => prev.filter((x) => x.connectionId !== row.connectionId));
      }
      toast.success(isRequest ? t("friends.declined") || "Declined" : t("friends.removed") || "Removed");
    } catch (err) {
      console.error(err);
      toast.error(t("common.error") || "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const PersonRow = ({ row, children }: { row: Row; children: React.ReactNode }) => (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
      <Link
        to="/auth/user/$userId"
        params={{ userId: row.profile.id }}
        className="flex min-w-0 items-center gap-3"
      >
        {row.profile.avatar_url ? (
          <img src={row.profile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-accent">
            <User className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {row.profile.full_name || row.profile.username || "Anonymous"}
          </p>
          {row.profile.username && (
            <p className="truncate text-xs text-muted-foreground">@{row.profile.username}</p>
          )}
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );

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
          <Users className="h-6 w-6 text-accent" /> {t("friends.title") || "Friends"}
        </h1>
        <Link
          to="/auth/invite"
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent"
        >
          <Gift className="h-4 w-4 text-accent" /> {t("nav.invite") || "Invite"}
        </Link>
      </div>

      {/* Incoming requests */}
      {requests.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            {t("friends.requests") || "Requests"} ({requests.length})
          </h2>
          <div className="space-y-2">
            {requests.map((row) => (
              <PersonRow key={row.connectionId} row={row}>
                <button
                  onClick={() => handleAccept(row)}
                  disabled={busy === row.connectionId}
                  className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                  aria-label={t("friends.accept") || "Accept"}
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleRemove(row, true)}
                  disabled={busy === row.connectionId}
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground disabled:opacity-50"
                  aria-label={t("friends.decline") || "Decline"}
                >
                  <X className="h-4 w-4" />
                </button>
              </PersonRow>
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          {t("friends.yourFriends") || "Your friends"} ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("friends.empty") || "No friends yet. Connect with mothers from the feed or community."}
          </p>
        ) : (
          <div className="space-y-2">
            {friends.map((row) => (
              <PersonRow key={row.connectionId} row={row}>
                <Link
                  to="/auth/messages"
                  search={{ partner: row.profile.id }}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-accent" /> {t("dm.message") || "Message"}
                </Link>
                <button
                  onClick={() => handleRemove(row, false)}
                  disabled={busy === row.connectionId}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                >
                  <UserMinus className="h-3.5 w-3.5" /> {t("friends.remove") || "Remove"}
                </button>
              </PersonRow>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
