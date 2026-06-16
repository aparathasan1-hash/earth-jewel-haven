import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  User,
  LogOut,
  ArrowLeft,
  Award,
  DoorOpen,
  Plus,
  MessageCircle,
  Crown,
  Pencil,
  Heart,
  BookOpen,
  FileText,
  Headphones,
  GraduationCap,
  Brain,
  Settings,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { MoodHeatmap } from "@/components/villa/MoodHeatmap";
import {
  getCurrentUser,
  getProfile,
  getUserBadges,
  getMyRooms,
  createRoom,
  signOut,
  getBabies,
  getMilestones,
  calculatePostpartumDays,
  calculateBabyAge,
  getSavedVaultItems,
  getMoodEntries,
  type Profile,
  type UserBadge,
  type Room,
  type Baby,
  type BabyMilestone,
  type VaultItemDB,
  type MoodEntry,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/profile")({
  head: () => ({
    meta: [
      { title: "Profile — The Villageless Mama" },
      { name: "description", content: "Your quiet corner." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const t = useT();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [babies, setBabies] = useState<Baby[]>([]);
  const [savedItems, setSavedItems] = useState<VaultItemDB[]>([]);
  const [allMilestones, setAllMilestones] = useState<Map<string, BabyMilestone[]>>(new Map());
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomDesc, setRoomDesc] = useState("");
  const [roomPrivate, setRoomPrivate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadProfile().then(() => {
      if (!cancelled) setLoading(false);
    }).catch((err) => {
      if (!cancelled) {
        console.error("❌ Profil yüklenirken hata:", err);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function loadProfile() {
    const user = await getCurrentUser();
    if (!user) {
      navigate({ to: "/auth/login" });
      return;
    }
    const [p, b, r, kids] = await Promise.all([
      getProfile(user.id),
      getUserBadges(user.id),
      getMyRooms(user.id),
      getBabies(user.id),
    ]);
    if (p) setProfile(p);
    setBadges(b);
    setRooms(r);
    setBabies(kids);

    // Load saved items and milestones
    const saved = await getSavedVaultItems(user.id);
    setSavedItems(saved);

    // Load milestones for each baby
    if (kids.length > 0) {
      const milestoneSets = await Promise.all(kids.map((kid) => getMilestones(kid.id)));
      const milestonesMap = new Map<string, BabyMilestone[]>();
      kids.forEach((kid, idx) => {
        milestonesMap.set(kid.id, milestoneSets[idx]);
      });
      setAllMilestones(milestonesMap);
    }

    // Load mood entries
    const moods = await getMoodEntries(user.id);
    setMoodEntries(moods);
  }

  async function handleLogout() {
    await signOut();
    navigate({ to: "/" });
  }

  async function handleCreateRoom() {
    if (!profile || !roomTitle.trim()) return;
    await createRoom(profile.id, roomTitle, roomDesc, roomPrivate);
    setShowCreateRoom(false);
    setRoomTitle("");
    setRoomDesc("");
    setRoomPrivate(false);
    loadProfile();
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
        <p className="text-muted-foreground">{t("auth.loginTitle")}</p>
        <Link
          to="/auth/login"
          className="mt-4 inline-block rounded-full bg-primary px-6 py-3 text-primary-foreground"
        >
          {t("auth.login")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 pt-8">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("nav.home")}
      </Link>

      {/* Profile header */}
      <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <a href={profile.avatar_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-24 w-24 rounded-2xl object-cover transition-transform hover:scale-105"
                  style={{ imageRendering: "auto" }}
                />
              </a>
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
                {profile.membership_type !== "gold" && (
                  <Link
                    to="/auth/gold"
                    className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-600 hover:bg-amber-500/25 dark:text-amber-400"
                  >
                    {t("gold.upgradeCta") || "Become Gold"}
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/auth/edit-profile"
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-4 w-4" /> {t("auth.editProfile")}
            </Link>
            <Link
              to="/auth/settings"
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" /> {t("auth.settings") || "Settings"}
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" /> {t("auth.logout")}
            </button>
          </div>
        </div>

        {profile.bio && <p className="mt-4 text-sm text-muted-foreground">{profile.bio}</p>}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {profile.baby_name && (
            <span>
              {t("auth.babyName")}: {profile.baby_name}
            </span>
          )}
          {profile.baby_birth_date && (
            <span>
              {t("auth.babyBirthDate")}: {profile.baby_birth_date}
            </span>
          )}
          <span>
            {t("auth.memberSince")}: {new Date(profile.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Babies */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg">
            <Heart className="h-5 w-5 text-accent" /> Bebeklerim
          </h2>
          <Link
            to="/auth/baby-add"
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Bebek Ekle
          </Link>
        </div>
        {babies.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Henüz bebek eklenmemiş. Bebeğinizi ekleyerek anılarını kaydedin!
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {babies.map((baby) => {
              const days = calculatePostpartumDays(baby.birth_date);
              const age = calculateBabyAge(baby.birth_date);
              const milestones = allMilestones.get(baby.id) || [];
              return (
                <Link
                  key={baby.id}
                  to="/auth/baby/$id"
                  params={{ id: baby.id }}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
                  preload="intent"
                >
                  {baby.photo_url ? (
                    <img
                      src={baby.photo_url}
                      alt={baby.name}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-accent">
                      <Heart className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{baby.name}</p>
                    <p className="text-xs text-muted-foreground">{days} günlük</p>
                    <p className="text-xs text-muted-foreground">
                      {age.years > 0 && `${age.years}y `}
                      {age.months > 0 && `${age.months}m `}
                      {age.days}d
                    </p>
                    {milestones.length > 0 && (
                      <p className="text-xs text-accent">
                        💫 {milestones.length} milestone{milestones.length !== 1 ? "s" : ""}
                      </p>
                    )}
                    {baby.gender && (
                      <p className="text-xs text-muted-foreground">
                        {baby.gender === "girl" ? "👧" : baby.gender === "boy" ? "👦" : "🧒"}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Badges */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-serif text-lg">
          <Award className="h-5 w-5 text-accent" /> {t("auth.badges")}
        </h2>
        {badges.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("auth.noBadges")}</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-3">
            {badges.map((ub) => (
              <div
                key={ub.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2"
              >
                <span className="text-lg">{ub.badges.icon}</span>
                <span className="text-sm">{ub.badges.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rooms */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg">
            <DoorOpen className="h-5 w-5 text-accent" /> {t("auth.rooms")}
          </h2>
          <button
            onClick={() => setShowCreateRoom(!showCreateRoom)}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> {t("auth.createRoom")}
          </button>
        </div>

        {showCreateRoom && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-5">
            <input
              type="text"
              value={roomTitle}
              onChange={(e) => setRoomTitle(e.target.value)}
              placeholder={t("auth.roomTitle")}
              className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <textarea
              value={roomDesc}
              onChange={(e) => setRoomDesc(e.target.value)}
              placeholder={t("auth.roomDesc")}
              rows={2}
              className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
            />
            <label className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={roomPrivate}
                onChange={(e) => setRoomPrivate(e.target.checked)}
                className="rounded border-border"
              />
              {t("auth.roomPrivate")}
            </label>
            <button
              onClick={handleCreateRoom}
              className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground"
            >
              {t("auth.createRoom")}
            </button>
          </div>
        )}

        {rooms.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("auth.createRoom")} {t("auth.community")}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {rooms.map((room) => (
              <a
                key={room.id}
                href={`/auth/community?roomId=${room.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
              >
                <div>
                  <p className="font-medium">{room.title}</p>
                  {room.description && (
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  )}
                </div>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Saved Content */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-serif text-lg">
          <Heart className="h-5 w-5 text-accent" /> {t("auth.savedContent") || "Saved Content"}
        </h2>
        {savedItems.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("auth.noSavedContent") || "No saved content yet. Visit the Vault to save your favorite items!"}
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {savedItems.map((item) => {
              const iconMap: { [key: string]: typeof BookOpen } = {
                Essay: BookOpen,
                Printable: FileText,
                Audio: Headphones,
                Course: GraduationCap,
              };
              const Icon = iconMap[item.type] || BookOpen;
              return (
                <Link
                  key={item.id}
                  to="/vault"
                  className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/40"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-accent">{item.type}</p>
                    <p className="mt-1 font-serif font-medium leading-snug truncate">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground truncate">{item.blurb}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Mood History */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-serif text-lg">
          <Brain className="h-5 w-5 text-accent" /> {t("auth.moodHistory") || "Mood History"}
        </h2>
        {moodEntries.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("auth.noMoodEntries") || "No mood entries yet. Start checking in daily! 💭"}
          </p>
        ) : (
          <div className="mt-4">
            <MoodHeatmap moodEntries={moodEntries} />
          </div>
        )}
      </section>

      {/* Community link */}
      <div className="mt-8 text-center">
        <Link
          to="/auth/community"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground"
        >
          <DoorOpen className="h-4 w-4" /> {t("auth.communityTitle")}
        </Link>
      </div>
    </div>
  );
}
