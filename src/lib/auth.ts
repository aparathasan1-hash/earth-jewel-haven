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
  profiles?: { username: string | null; full_name: string | null };
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
    .select("*, profiles(username, full_name)")
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
