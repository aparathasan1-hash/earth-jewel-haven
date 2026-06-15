import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User,
  ArrowLeft,
  Award,
  DoorOpen,
  Crown,
  Heart,
  Brain,
  BookOpen,
  FileText,
  Headphones,
  GraduationCap,
} from "lucide-react";
import { UserPlus, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { MoodHeatmap } from "@/components/villa/MoodHeatmap";
import {
  getPublicProfile,
  getCurrentUser,
  getConnectionState,
  sendConnectionRequest,
  acceptConnectionRequest,
  type PublicProfileInfo,
  type ConnectionState,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/user/$userId")({
  head: ({ params }) => ({
    meta: [
      { title: "Profile — The Villageless Mama" },
      { name: "description", content: "User profile." },
    ],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const t = useT();
  const navigate = useNavigate();
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<PublicProfileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [connState, setConnState] = useState<ConnectionState>("none");
  const [connId, setConnId] = useState<string | null>(null);
  const [connBusy, setConnBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const [profileData, currentUser] = await Promise.all([
          getPublicProfile(userId),
          getCurrentUser(),
        ]);
        if (cancelled) return;
        if (!profileData) {
          navigate({ to: "/auth/community" });
          return;
        }
        setProfile(profileData);
        setCurrentUserId(currentUser?.id ?? null);
        if (currentUser && currentUser.id !== userId) {
          const { state, connectionId } = await getConnectionState(currentUser.id, userId);
          if (!cancelled) {
            setConnState(state);
            setConnId(connectionId);
          }
        }
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading profile:", err);
          setLoading(false);
          navigate({ to: "/auth/community" });
        }
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [userId, navigate]);

  async function handleAddFriend() {
    if (!currentUserId) {
      navigate({ to: "/auth/login" });
      return;
    }
    setConnBusy(true);
    try {
      await sendConnectionRequest(currentUserId, userId);
      setConnState("request_sent");
      toast.success(t("friends.requestSent") || "Request sent");
    } catch (err) {
      console.error(err);
      toast.error(t("common.error") || "Something went wrong");
    } finally {
      setConnBusy(false);
    }
  }

  async function handleAcceptFriend() {
    if (!connId) return;
    setConnBusy(true);
    try {
      await acceptConnectionRequest(connId);
      setConnState("friends");
      toast.success(t("friends.accepted") || "Request accepted");
    } catch (err) {
      console.error(err);
      toast.error(t("common.error") || "Something went wrong");
    } finally {
      setConnBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-5 pt-12 text-center">
        <p className="text-muted-foreground">User not found</p>
        <Link
          to="/auth/community"
          className="mt-4 inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground"
        >
          Back to Community
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <Link
        to="/auth/community"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("auth.community")}
      </Link>

      {/* Profile header */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="h-24 w-24 rounded-2xl object-cover"
              style={{ imageRendering: "auto" }}
            />
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-2xl bg-secondary text-accent">
              <User className="h-10 w-10" />
            </div>
          )}
          <div>
            <h1 className="font-serif text-xl">{profile.full_name || t("auth.profile")}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <div className="mt-1 flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs capitalize text-muted-foreground">
                {profile.membership_type === "gold" ? t("auth.gold") : t("auth.free")}
              </span>
            </div>
          </div>
        </div>

        {profile.bio && <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            {t("auth.memberSince")}: {new Date(profile.created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Friend action */}
        {currentUserId && currentUserId !== userId && (
          <div className="mt-4">
            {connState === "friends" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-accent" /> {t("friends.friends") || "Friends"}
              </span>
            )}
            {connState === "request_sent" && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> {t("friends.pending") || "Request sent"}
              </span>
            )}
            {connState === "request_received" && (
              <button
                onClick={handleAcceptFriend}
                disabled={connBusy}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> {t("friends.acceptRequest") || "Accept request"}
              </button>
            )}
            {connState === "none" && (
              <button
                onClick={handleAddFriend}
                disabled={connBusy}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" /> {t("friends.addFriend") || "Add friend"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Badges */}
      {profile.badges && profile.badges.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-serif text-lg">
            <Award className="h-5 w-5 text-accent" /> {t("auth.badges")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {profile.badges.map((ub) => (
              <div
                key={ub.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2"
              >
                <span className="text-lg">{ub.badges.icon}</span>
                <span className="text-sm">{ub.badges.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Rooms */}
      {profile.rooms && profile.rooms.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-serif text-lg">
            <DoorOpen className="h-5 w-5 text-accent" /> Created Rooms
          </h2>
          <div className="mt-3 space-y-3">
            {profile.rooms.map((room) => (
              <Link
                key={room.id}
                to="/auth/community"
                search={{ roomId: room.id }}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
              >
                <div>
                  <p className="font-medium">{room.title}</p>
                  {room.description && (
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  )}
                </div>
                <DoorOpen className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Activity stats */}
      {profile.moodStats && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-serif text-lg">
            <Brain className="h-5 w-5 text-accent" /> Activity
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-secondary/40 border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Check-ins</p>
              <p className="mt-1 text-xl font-semibold">{profile.moodStats.totalEntries}</p>
            </div>
            <div className="rounded-xl bg-secondary/40 border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Avg Mood</p>
              <p className="mt-1 text-xl font-semibold">
                {profile.moodStats.averageMood > 0 ? profile.moodStats.averageMood.toFixed(1) : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-secondary/40 border border-border p-3 text-center">
              <p className="text-xs text-muted-foreground">Rooms Created</p>
              <p className="mt-1 text-xl font-semibold">{profile.rooms?.length || 0}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
