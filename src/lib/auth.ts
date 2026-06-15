import { supabase } from "./supabase";
import type { Lang } from "./i18n";

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  membership_type: "free" | "gold";
  baby_name: string | null;
  baby_birth_date: string | null;
  is_admin: boolean;
  is_verified_expert?: boolean;
  expert_title?: string | null;
  created_at: string;
};

export type Badge = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
};

export type UserBadge = {
  id: string;
  badge_id: string;
  badges: Badge;
};

export type Room = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_private: boolean;
  created_at: string;
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null };
};

export type RoomMessage = {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null };
};

// --- Baby Profile ---

export type Baby = {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  photo_url: string | null;
  gender: "girl" | "boy" | "other" | null;
  weight_kg: number | null;
  height_cm: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BabyMilestone = {
  id: string;
  baby_id: string;
  type: string;
  date: string;
  note: string | null;
  created_at: string;
};

export type AnniversaryBadge = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  years_required: number;
  created_at: string;
};

export type AutoBadge = {
  id: string;
  user_id: string;
  badge_type: string;
  badge_name: string;
  badge_icon: string | null;
  awarded_at: string;
};

// --- Auth ---

export async function signUp(email: string, password: string, fullName: string) {
  console.log("🔐 signUp başladı:", { email, fullName });
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      data: { full_name: fullName },
      emailRedirectTo: window.location.origin + "/auth/callback",
    },
  });
  
  console.log("🔐 signUp sonucu:", { data, error });
  
  if (error) {
    console.error("❌ signUp hatası:", error);
    throw error;
  }

  // Profile creation is handled by database trigger - no need to insert from frontend
  if (data.user) {
    console.log("👤 Kullanıcı oluştu, ID:", data.user.id);
    console.log("👤 Session var mı:", !!data.session);
  } else {
    console.warn("⚠️ Kullanıcı nesnesi oluşmadı");
  }

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch (err) {
    console.error("❌ getCurrentUser hatası:", err);
    return null;
  }
}

// --- Profile ---

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) {
      console.warn("⚠️ Profil bulunamadı:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("❌ getProfile hatası:", err);
    return null;
  }
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

// --- Avatar Upload ---

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Dosya adını benzersiz yap
  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Eski avatarı bul ve sil
  const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("id", userId).single();
  if (profile?.avatar_url) {
    const oldPath = profile.avatar_url.replace(/.*\/storage\/v1\/object\/public\/avatars\//, "");
    if (oldPath) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  // Yeni dosyayı yükle
  const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  // Public URL al
  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  // Profili güncelle
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);
  if (updateError) throw updateError;

  return publicUrl;
}

// --- Badges ---

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data } = await supabase
    .from("user_badges")
    .select("id, badge_id, badges(*)")
    .eq("user_id", userId);
  return (data as unknown as UserBadge[]) ?? [];
}

// --- Rooms ---

export async function getRooms(): Promise<Room[]> {
  const { data } = await supabase
    .from("rooms")
    .select("*, profiles(username, full_name, avatar_url)")
    .eq("is_private", false)
    .order("created_at", { ascending: false });
  return (data as Room[]) ?? [];
}

export async function getMyRooms(userId: string): Promise<Room[]> {
  const { data } = await supabase
    .from("rooms")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as Room[]) ?? [];
}

export async function createRoom(userId: string, title: string, description: string, isPrivate: boolean) {
  const { error } = await supabase.from("rooms").insert({
    user_id: userId,
    title,
    description,
    is_private: isPrivate,
  });
  if (error) throw error;
}

export async function getRoomMessages(roomId: string): Promise<RoomMessage[]> {
  const { data } = await supabase
    .from("room_messages")
    .select("*, profiles(username, full_name, avatar_url)")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  return (data as RoomMessage[]) ?? [];
}

export async function sendMessage(roomId: string, userId: string, content: string) {
  const { error } = await supabase.from("room_messages").insert({
    room_id: roomId,
    user_id: userId,
    content,
  });
  if (error) throw error;
  // Oda katılımcılarına push (best-effort)
  try {
    const { notifyRoomMessage } = await import("./api/push.functions");
    await notifyRoomMessage({
      data: { roomId, senderId: userId, preview: content.slice(0, 120) },
    });
  } catch (e) {
    console.warn("notifyRoomMessage başarısız:", e);
  }
}

export async function editMessage(messageId: string, userId: string, newContent: string) {
  const { error } = await supabase
    .from("room_messages")
    .update({ content: newContent, edited_at: new Date().toISOString() })
    .eq("id", messageId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function deleteMessage(messageId: string, userId: string) {
  const { error } = await supabase
    .from("room_messages")
    .delete()
    .eq("id", messageId)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getRoomMemberCount(roomId: string): Promise<number> {
  // Supabase JS'te .distinct() yok; benzersiz üye sayısını JS'te hesaplıyoruz.
  const { data, error } = await supabase
    .from("room_messages")
    .select("user_id")
    .eq("room_id", roomId);
  if (error) throw error;
  return data ? new Set(data.map((d) => d.user_id)).size : 0;
}

export async function getRoomDetails(roomId: string): Promise<RoomDetailedInfo | null> {
  const user = await getCurrentUser();
  const { data: roomData } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (!roomData) return null;

  const memberCount = await getRoomMemberCount(roomId);

  const { data: lastMsg } = await supabase
    .from("room_messages")
    .select("created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return {
    ...(roomData as Room),
    memberCount,
    lastMessageTime: lastMsg?.created_at || null,
    isOwner: user?.id === roomData.user_id,
  };
}

export async function getPublicProfile(userId: string): Promise<PublicProfileInfo | null> {
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, bio, membership_type, created_at")
    .eq("id", userId)
    .single();

  if (!profileData) return null;

  const [badges, rooms, moodEntries] = await Promise.all([
    getUserBadges(userId),
    getMyRooms(userId),
    getMoodEntries(userId),
  ]);

  return {
    id: profileData.id,
    username: profileData.username,
    full_name: profileData.full_name,
    avatar_url: profileData.avatar_url,
    bio: profileData.bio,
    membership_type: profileData.membership_type,
    created_at: profileData.created_at,
    badges,
    rooms,
    moodStats: {
      totalEntries: moodEntries.length,
      averageMood: moodEntries.length > 0
        ? Math.round((moodEntries.reduce((sum, e) => sum + e.mood, 0) / moodEntries.length) * 10) / 10
        : 0,
    },
  };
}

// --- Admin ---

export async function getAllUsers(): Promise<Profile[]> {
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  return (data as Profile[]) ?? [];
}

export async function getAllBadges(): Promise<Badge[]> {
  const { data } = await supabase.from("badges").select("*").order("name");
  return (data as Badge[]) ?? [];
}

export async function awardBadge(userId: string, badgeId: string) {
  const { error } = await supabase.from("user_badges").insert({ user_id: userId, badge_id: badgeId });
  if (error) throw error;
}

export async function updateMembership(userId: string, type: "free" | "gold") {
  const { error } = await supabase.from("profiles").update({ membership_type: type }).eq("id", userId);
  if (error) throw error;
}

// --- Vault CRUD (Admin) ---

export type VaultItemDB = {
  id: string;
  title: string;
  type: "Essay" | "Printable" | "Audio" | "Course";
  tags: string[];
  blurb: string;
  body: string[];
  printable: string[];
  audio_note: string | null;
  coming_soon: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getVaultItems(): Promise<VaultItemDB[]> {
  const { data } = await supabase
    .from("vault_items")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as VaultItemDB[]) ?? [];
}

export async function createVaultItem(item: {
  title: string;
  type: "Essay" | "Printable" | "Audio" | "Course";
  tags: string[];
  blurb: string;
  body?: string[];
  printable?: string[];
  audio_note?: string;
  coming_soon?: boolean;
  created_by?: string;
}) {
  const { error } = await supabase.from("vault_items").insert(item);
  if (error) throw error;
}

export async function updateVaultItem(id: string, updates: Partial<VaultItemDB>) {
  const { error } = await supabase.from("vault_items").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteVaultItem(id: string) {
  const { error } = await supabase.from("vault_items").delete().eq("id", id);
  if (error) throw error;
}

// --- Bookmarks (Saved Vault Items) ---

export async function getSavedVaultItems(userId: string): Promise<VaultItemDB[]> {
  const { data } = await supabase
    .from("saved_vault_items")
    .select("vault_items(*)")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (!data) return [];
  return data.map((item: any) => item.vault_items as VaultItemDB);
}

export async function saveVaultItem(userId: string, vaultItemId: string) {
  const { error } = await supabase.from("saved_vault_items").insert({
    user_id: userId,
    vault_item_id: vaultItemId,
  });
  if (error) throw error;
}

export async function unsaveVaultItem(userId: string, vaultItemId: string) {
  const { error } = await supabase
    .from("saved_vault_items")
    .delete()
    .eq("user_id", userId)
    .eq("vault_item_id", vaultItemId);
  if (error) throw error;
}

export async function checkIfVaultItemSaved(userId: string, vaultItemId: string): Promise<boolean> {
  const { data } = await supabase
    .from("saved_vault_items")
    .select("id")
    .eq("user_id", userId)
    .eq("vault_item_id", vaultItemId)
    .single();
  return !!data;
}

// --- Breath Sessions ---

export type BreathSession = {
  id?: string;
  user_id: string;
  date: string;
  total_seconds: number;
  cycles: number;
  pattern: string;
};

export async function saveBreathSession(session: BreathSession) {
  const { error } = await supabase.from("breath_sessions").insert(session);
  if (error) {
    console.warn("⚠️ Breath session save failed (may be offline):", error);
    // Don't throw - this is non-critical
  }
}

export async function getBreathSessions(userId: string): Promise<BreathSession[]> {
  const { data } = await supabase
    .from("breath_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  return (data as BreathSession[]) ?? [];
}

// --- Baby Profile Functions ---

export async function getBabies(userId: string): Promise<Baby[]> {
  const { data } = await supabase
    .from("babies")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as Baby[]) ?? [];
}

export async function getBaby(babyId: string): Promise<Baby | null> {
  const { data } = await supabase
    .from("babies")
    .select("*")
    .eq("id", babyId)
    .single();
  return data as Baby | null;
}

export async function createBaby(baby: {
  user_id: string;
  name: string;
  birth_date: string;
  gender?: "girl" | "boy" | "other";
  weight_kg?: number;
  height_cm?: number;
  notes?: string;
}) {
  const { error } = await supabase.from("babies").insert(baby);
  if (error) throw error;
}

export async function updateBaby(babyId: string, updates: Partial<Baby>) {
  const { error } = await supabase.from("babies").update(updates).eq("id", babyId);
  if (error) throw error;
}

export async function deleteBaby(babyId: string) {
  const { error } = await supabase.from("babies").delete().eq("id", babyId);
  if (error) throw error;
}

export async function uploadBabyPhoto(babyId: string, userId: string, file: File): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${babyId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from("baby_photos").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("baby_photos").getPublicUrl(filePath);
  return urlData.publicUrl;
}

// --- Baby Milestones ---

export async function getMilestones(babyId: string): Promise<BabyMilestone[]> {
  const { data } = await supabase
    .from("baby_milestones")
    .select("*")
    .eq("baby_id", babyId)
    .order("date", { ascending: false });
  return (data as BabyMilestone[]) ?? [];
}

export async function createMilestone(milestone: {
  baby_id: string;
  type: string;
  date: string;
  note?: string;
}) {
  const { error } = await supabase.from("baby_milestones").insert(milestone);
  if (error) throw error;
}

export async function deleteMilestone(milestoneId: string) {
  const { error } = await supabase.from("baby_milestones").delete().eq("id", milestoneId);
  if (error) throw error;
}

// --- Baby Measurements (Büyüme takibi, Faz 4A) ---

export type BabyMeasurement = {
  id: string;
  baby_id: string;
  date: string;
  weight_kg: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  note: string | null;
  created_at: string;
};

export async function getBabyMeasurements(babyId: string): Promise<BabyMeasurement[]> {
  const { data } = await supabase
    .from("baby_measurements")
    .select("*")
    .eq("baby_id", babyId)
    .order("date", { ascending: true });
  return (data as BabyMeasurement[]) ?? [];
}

export async function saveBabyMeasurement(m: {
  baby_id: string;
  date: string;
  weight_kg?: number | null;
  height_cm?: number | null;
  head_circumference_cm?: number | null;
  note?: string | null;
}) {
  const { error } = await supabase.from("baby_measurements").insert(m);
  if (error) throw error;
}

export async function deleteBabyMeasurement(measurementId: string) {
  const { error } = await supabase.from("baby_measurements").delete().eq("id", measurementId);
  if (error) throw error;
}

// --- Anniversary Badges ---

export async function getAnniversaryBadges(): Promise<AnniversaryBadge[]> {
  const { data } = await supabase
    .from("anniversary_badges")
    .select("*")
    .order("years_required", { ascending: true });
  return (data as AnniversaryBadge[]) ?? [];
}

export async function getAutoBadges(userId: string): Promise<AutoBadge[]> {
  const { data } = await supabase
    .from("auto_badges")
    .select("*")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: false });
  return (data as AutoBadge[]) ?? [];
}

// --- Postpartum Calculator ---

export function calculatePostpartumDays(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  const diff = now.getTime() - birth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function calculateBabyAge(birthDate: string): { years: number; months: number; days: number } {
  const birth = new Date(birthDate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
}

// --- Mood Tracker ---

export type MoodEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  mood: 1 | 2 | 3 | 4 | 5;
  emoji?: string;
  note?: string;
  created_at: string;
  updated_at: string;
};

// --- Community Enhancements ---

export type RoomDetailedInfo = Room & {
  memberCount: number;
  lastMessageTime: string | null;
  isOwner: boolean;
};

export type PublicProfileInfo = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  membership_type: "free" | "gold";
  created_at: string;
  badges: UserBadge[];
  rooms: Room[];
  breathStats?: {
    totalMinutes: number;
    streak: number;
  };
  moodStats?: {
    totalEntries: number;
    averageMood: number;
  };
};

// --- Settings & Preferences ---

export type VisibilityLevel = "everyone" | "friends" | "none";
export type ProfileVisibility = "public" | "friends" | "private";

export type NotificationPreferences = {
  id: string;
  user_id: string;
  email_daily_reminder: boolean;
  email_weekly_summary: boolean;
  push_notifications: boolean;
  // Gizlilik tercihleri (Aşama B)
  profile_visibility: ProfileVisibility;
  show_baby_info: VisibilityLevel;
  show_mood: VisibilityLevel;
  show_activity: VisibilityLevel;
  show_online_status: boolean;
  created_at: string;
  updated_at: string;
};

export async function getMoodEntries(userId: string): Promise<MoodEntry[]> {
  const { data } = await supabase
    .from("mood_entries")
    .select("*")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });
  return (data as MoodEntry[]) ?? [];
}

export async function getTodayMood(userId: string): Promise<MoodEntry | null> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("mood_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", today)
    .single();
  return (data as MoodEntry) || null;
}

export async function saveMoodEntry(userId: string, mood: 1 | 2 | 3 | 4 | 5, note?: string) {
  const today = new Date().toISOString().split("T")[0];
  const moodEmojis = ["😢", "😟", "😐", "🙂", "😊"];
  const emoji = moodEmojis[mood - 1];

  const { error } = await supabase.from("mood_entries").upsert({
    user_id: userId,
    entry_date: today,
    mood,
    emoji,
    note: note || null,
  });
  if (error) throw error;
}

export async function deleteMoodEntry(userId: string, entryDate: string) {
  const { error } = await supabase
    .from("mood_entries")
    .delete()
    .eq("user_id", userId)
    .eq("entry_date", entryDate);
  if (error) throw error;
}

// --- Notification Preferences ---

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  let { data } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!data) {
    const { data: newPrefs } = await supabase
      .from("user_preferences")
      .insert({
        user_id: userId,
        email_daily_reminder: true,
        email_weekly_summary: true,
        push_notifications: false,
      })
      .select()
      .single();
    return newPrefs as NotificationPreferences;
  }

  return data as NotificationPreferences;
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
) {
  const { error } = await supabase
    .from("user_preferences")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) throw error;
}

// --- Onboarding & Keşif (Faz 2) ---

export type OnboardingState = {
  onboarded: boolean;
  city: string | null;
  interests: string[];
};

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const { data } = await supabase
    .from("user_preferences")
    .select("onboarded, city, interests")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) {
    // Tercih satırı yoksa oluştur (varsayılan: onboarded=false)
    await supabase.from("user_preferences").insert({ user_id: userId }).select().maybeSingle();
    return { onboarded: false, city: null, interests: [] };
  }
  return {
    onboarded: Boolean(data.onboarded),
    city: (data.city as string) ?? null,
    interests: (data.interests as string[]) ?? [],
  };
}

export async function updateOnboarding(
  userId: string,
  updates: { city?: string | null; interests?: string[]; onboarded?: boolean }
) {
  const { error } = await supabase
    .from("user_preferences")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

export type DiscoverProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  baby_birth_date: string | null;
  city: string | null;
  shared_interests: number;
  same_city: boolean;
  baby_age_days_diff: number | null;
};

// Bebek yaşı + şehir + ortak ilgi alanına göre arkadaş önerileri.
// Gizliliği SECURITY DEFINER SQL fonksiyonu (discover_profiles) uygular.
export async function discoverProfiles(
  userId: string,
  limit = 30
): Promise<DiscoverProfile[]> {
  const { data, error } = await supabase.rpc("discover_profiles", {
    p_viewer: userId,
    p_limit: limit,
  });
  if (error) throw error;
  return (data as DiscoverProfile[]) ?? [];
}

// --- Canlı Yayın (Live Streaming L1) ---

export type LiveStream = {
  id: string;
  host_id: string;
  title: string;
  status: "live" | "ended";
  viewer_count: number;
  is_private: boolean;
  ended_reason: string | null;
  started_at: string;
  ended_at: string | null;
  profiles?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    is_verified_expert?: boolean;
    expert_title?: string | null;
  };
};

const streamHostSelect =
  "*, profiles!live_streams_host_id_fkey(username, full_name, avatar_url, is_verified_expert, expert_title)";

// Yayın başlat → oluşturulan yayın kaydını döndür (oda adı = id)
export async function startStream(
  hostId: string,
  title: string,
  isPrivate = false
): Promise<LiveStream> {
  const { data, error } = await supabase
    .from("live_streams")
    .insert({ host_id: hostId, title, is_private: isPrivate, status: "live" })
    .select(streamHostSelect)
    .single();
  if (error) throw error;
  return data as LiveStream;
}

// Yayını bitir (sahibi: 'host'; admin kill-switch: 'admin')
export async function endStream(streamId: string, reason: "host" | "admin" = "host") {
  const { error } = await supabase
    .from("live_streams")
    .update({ status: "ended", ended_at: new Date().toISOString(), ended_reason: reason })
    .eq("id", streamId);
  if (error) throw error;
}

// Aktif (canlı + public) yayınlar — keşif
export async function getLiveStreams(): Promise<LiveStream[]> {
  const { data } = await supabase
    .from("live_streams")
    .select(streamHostSelect)
    .eq("status", "live")
    .eq("is_private", false)
    .order("started_at", { ascending: false });
  return (data as LiveStream[]) ?? [];
}

export async function getStream(streamId: string): Promise<LiveStream | null> {
  const { data } = await supabase
    .from("live_streams")
    .select(streamHostSelect)
    .eq("id", streamId)
    .maybeSingle();
  return (data as LiveStream) ?? null;
}

export async function updateViewerCount(streamId: string, count: number) {
  await supabase.from("live_streams").update({ viewer_count: count }).eq("id", streamId);
}

// --- Yayın içi sohbet ---
export type StreamMessage = {
  id: string;
  stream_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null };
};

export async function getStreamMessages(streamId: string): Promise<StreamMessage[]> {
  const { data } = await supabase
    .from("stream_messages")
    .select("*, profiles(username, full_name, avatar_url)")
    .eq("stream_id", streamId)
    .order("created_at", { ascending: true })
    .limit(200);
  return (data as StreamMessage[]) ?? [];
}

export async function sendStreamMessage(streamId: string, userId: string, content: string) {
  const { error } = await supabase
    .from("stream_messages")
    .insert({ stream_id: streamId, user_id: userId, content });
  if (error) throw error;
}

// İzleyici bildirimi (moderasyon)
export async function reportStream(streamId: string, reporterId: string, reason: string) {
  const { error } = await supabase
    .from("stream_reports")
    .upsert(
      { stream_id: streamId, reporter_id: reporterId, reason },
      { onConflict: "stream_id,reporter_id" }
    );
  if (error) throw error;
}

// --- Uzman Doğrulama (Live L2) ---

export type ExpertApplication = {
  id: string;
  user_id: string;
  full_name: string;
  profession: string;
  expert_title: string | null;
  document_path: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null };
};

// Başvuru gönder: belgeyi özel bucket'a yükle + kayıt oluştur
export async function submitExpertApplication(
  userId: string,
  fields: { fullName: string; profession: string; expertTitle?: string },
  file: File
): Promise<void> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("expert_docs")
    .upload(path, file, { upsert: true });
  if (upErr) throw upErr;

  // Önceki başvuruyu (varsa) temizle → tek aktif başvuru
  await supabase.from("expert_applications").delete().eq("user_id", userId);

  const { error } = await supabase.from("expert_applications").insert({
    user_id: userId,
    full_name: fields.fullName,
    profession: fields.profession,
    expert_title: fields.expertTitle ?? null,
    document_path: path,
  });
  if (error) throw error;
}

export async function getMyExpertApplication(userId: string): Promise<ExpertApplication | null> {
  const { data } = await supabase
    .from("expert_applications")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ExpertApplication) ?? null;
}

// Admin: tüm başvurular (başvuran profili ile)
export async function getExpertApplications(): Promise<ExpertApplication[]> {
  const { data } = await supabase
    .from("expert_applications")
    .select("*, profiles!expert_applications_user_id_fkey(username, full_name, avatar_url)")
    .order("created_at", { ascending: false });
  return (data as ExpertApplication[]) ?? [];
}

// Admin: belgeyi görüntülemek için imzalı URL (özel bucket)
export async function getExpertDocUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("expert_docs").createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

// Admin: onayla (SECURITY DEFINER fn → profiles.is_verified_expert=true)
export async function approveExpertApplication(appId: string, note?: string) {
  const { error } = await supabase.rpc("approve_expert_application", {
    p_app_id: appId,
    p_note: note ?? null,
  });
  if (error) throw error;
}

// Admin: reddet
export async function rejectExpertApplication(appId: string, note?: string) {
  const user = await getCurrentUser();
  const { error } = await supabase
    .from("expert_applications")
    .update({
      status: "rejected",
      review_note: note ?? null,
      reviewed_by: user?.id ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", appId);
  if (error) throw error;
}

// --- Birth Club (doğum-ayı kohort grupları, Faz 2.4) ---

// Bebek doğum tarihinden kohort anahtarı "YYYY-MM"
export function babyCohort(birthDate: string): string {
  return birthDate.slice(0, 7); // ISO 'YYYY-MM-DD' → 'YYYY-MM'
}

// Kohort için okunabilir başlık, "March 2026 Birth Club" / "Mart 2026 Doğum Kulübü"
export function birthClubTitle(cohort: string, lang: Lang): string {
  const [y, m] = cohort.split("-").map(Number);
  const localeMap: Record<Lang, string> = {
    en: "en-US",
    tr: "tr-TR",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
  };
  const monthName = new Date(y, (m || 1) - 1, 1).toLocaleString(
    localeMap[lang] || "en-US",
    { month: "long" }
  );
  const suffix = lang === "tr" ? "Doğum Kulübü" : "Birth Club";
  return `${monthName} ${y} ${suffix}`;
}

// Kullanıcının kohort odasını bul/oluştur, oda id'sini döndür.
export async function getOrCreateBirthClub(
  userId: string,
  cohort: string,
  title: string
): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_or_create_birth_club", {
    p_owner: userId,
    p_cohort: cohort,
    p_title: title,
  });
  if (error) throw error;
  return (data as string) ?? null;
}

// --- Connections (Arkadaşlık) ---

export type ConnectionStatus = "pending" | "accepted";

export type Connection = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null };
};

export type ConnectionState = "none" | "friends" | "request_sent" | "request_received";

const connectionProfileSelect =
  "id, requester_id, addressee_id, status, created_at, updated_at";

// Arkadaşlık isteği gönder
export async function sendConnectionRequest(requesterId: string, addresseeId: string) {
  const { error } = await supabase.from("connections").insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: "pending",
  });
  if (error) throw error;
  // Push bildirimi (best-effort — bildirim başarısızlığı isteği bozmasın)
  try {
    const { notifyConnectionRequest } = await import("./api/push.functions");
    await notifyConnectionRequest({ data: { requesterId, addresseeId } });
  } catch (e) {
    console.warn("notifyConnectionRequest başarısız:", e);
  }
}

// Gelen isteği kabul et
export async function acceptConnectionRequest(connectionId: string) {
  const { error } = await supabase
    .from("connections")
    .update({ status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", connectionId);
  if (error) throw error;
  try {
    const { notifyConnectionAccepted } = await import("./api/push.functions");
    await notifyConnectionAccepted({ data: { connectionId } });
  } catch (e) {
    console.warn("notifyConnectionAccepted başarısız:", e);
  }
}

// İsteği reddet / arkadaşlığı kaldır / isteği geri çek
export async function removeConnection(connectionId: string) {
  const { error } = await supabase.from("connections").delete().eq("id", connectionId);
  if (error) throw error;
}

// Kabul edilmiş arkadaşların profil bilgileri (karşı taraf)
export async function getFriends(userId: string): Promise<
  { connectionId: string; profile: Profile }[]
> {
  const { data } = await supabase
    .from("connections")
    .select(`${connectionProfileSelect}`)
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  const conns = (data as Connection[]) ?? [];
  if (conns.length === 0) return [];

  // Karşı tarafların profillerini topla
  const otherIds = conns.map((c) =>
    c.requester_id === userId ? c.addressee_id : c.requester_id
  );
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .in("id", otherIds);

  const profileMap = new Map((profilesData as Profile[] ?? []).map((p) => [p.id, p]));
  return conns
    .map((c) => {
      const otherId = c.requester_id === userId ? c.addressee_id : c.requester_id;
      const profile = profileMap.get(otherId);
      return profile ? { connectionId: c.id, profile } : null;
    })
    .filter((x): x is { connectionId: string; profile: Profile } => x !== null);
}

// Bana gelen bekleyen istekler (gönderenin profiliyle)
export async function getIncomingRequests(userId: string): Promise<
  { connectionId: string; profile: Profile }[]
> {
  const { data } = await supabase
    .from("connections")
    .select(connectionProfileSelect)
    .eq("status", "pending")
    .eq("addressee_id", userId);

  const conns = (data as Connection[]) ?? [];
  if (conns.length === 0) return [];

  const { data: profilesData } = await supabase
    .from("profiles")
    .select("*")
    .in("id", conns.map((c) => c.requester_id));

  const profileMap = new Map((profilesData as Profile[] ?? []).map((p) => [p.id, p]));
  return conns
    .map((c) => {
      const profile = profileMap.get(c.requester_id);
      return profile ? { connectionId: c.id, profile } : null;
    })
    .filter((x): x is { connectionId: string; profile: Profile } => x !== null);
}

// İki kullanıcı arasındaki ilişki durumu (profil sayfasında buton için)
export async function getConnectionState(
  userId: string,
  otherUserId: string
): Promise<{ state: ConnectionState; connectionId: string | null }> {
  const { data } = await supabase
    .from("connections")
    .select(connectionProfileSelect)
    .or(
      `and(requester_id.eq.${userId},addressee_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},addressee_id.eq.${userId})`
    )
    .maybeSingle();

  const conn = data as Connection | null;
  if (!conn) return { state: "none", connectionId: null };
  if (conn.status === "accepted") return { state: "friends", connectionId: conn.id };
  // pending
  if (conn.requester_id === userId) return { state: "request_sent", connectionId: conn.id };
  return { state: "request_received", connectionId: conn.id };
}

// --- Posts (Paylaşım Akışı) ---

export type PostVisibility = "public" | "friends" | "private";

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  visibility: PostVisibility;
  created_at: string;
  updated_at: string;
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null };
};

export async function createPost(
  userId: string,
  content: string,
  visibility: PostVisibility,
  imageUrl?: string | null
) {
  const { error } = await supabase.from("posts").insert({
    user_id: userId,
    content,
    visibility,
    image_url: imageUrl ?? null,
  });
  if (error) throw error;
}

// Akış: RLS sayesinde sadece görmeye yetkili olduğun paylaşımlar gelir
export async function getFeed(limit = 50): Promise<Post[]> {
  const { data } = await supabase
    .from("posts")
    .select("*, profiles(username, full_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as Post[]) ?? [];
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const { data } = await supabase
    .from("posts")
    .select("*, profiles(username, full_name, avatar_url)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as Post[]) ?? [];
}

export async function updatePost(postId: string, updates: Partial<Pick<Post, "content" | "visibility" | "image_url">>) {
  const { error } = await supabase
    .from("posts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", postId);
  if (error) throw error;
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) throw error;
}

// --- AI Assistant (Yanında) ---

export type AiMode = "support" | "couples_bridge";

export type AiConversation = {
  id: string;
  user_id: string;
  mode: AiMode;
  title: string | null;
  created_at: string;
  updated_at: string;
};

export type AiMessage = {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  meta: Record<string, unknown> | null;
  created_at: string;
};

export async function createConversation(
  userId: string,
  mode: AiMode,
  title?: string
): Promise<AiConversation> {
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({ user_id: userId, mode, title: title ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as AiConversation;
}

export async function getConversations(userId: string): Promise<AiConversation[]> {
  const { data } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return (data as AiConversation[]) ?? [];
}

export async function getConversationMessages(conversationId: string): Promise<AiMessage[]> {
  const { data } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data as AiMessage[]) ?? [];
}

export async function addAiMessage(
  conversationId: string,
  userId: string,
  role: "user" | "assistant",
  content: string,
  meta?: Record<string, unknown>
): Promise<AiMessage> {
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({ conversation_id: conversationId, user_id: userId, role, content, meta: meta ?? null })
    .select()
    .single();
  if (error) throw error;
  // sohbetin updated_at'ini tazele (sıralama için)
  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  return data as AiMessage;
}

export async function deleteConversation(conversationId: string) {
  const { error } = await supabase.from("ai_conversations").delete().eq("id", conversationId);
  if (error) throw error;
}

// --- Push Subscriptions ---

export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; p256dh: string; auth: string; user_agent?: string }
) {
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
      user_agent: sub.user_agent ?? null,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
  if (error) throw error;
}