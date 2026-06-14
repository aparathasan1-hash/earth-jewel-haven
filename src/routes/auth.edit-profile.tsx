import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Camera, Loader2, User, Save } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  getProfile,
  updateProfile,
  uploadAvatar,
  type Profile,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/edit-profile")({
  head: () => ({
    meta: [
      { title: "Edit Profile — The Villageless Mama" },
      { name: "description", content: "Update your personal details." },
    ],
  }),
  component: EditProfilePage,
});

function EditProfilePage() {
  const t = useT();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [babyName, setBabyName] = useState("");
  const [babyBirthDate, setBabyBirthDate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadProfile().then(() => {
      if (!cancelled) setLoading(false);
    }).catch((err) => {
      if (!cancelled) {
        console.error("❌ Profil yüklenirken hata:", err);
        toast.error(t("auth.profileUpdateError"));
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
    const p = await getProfile(user.id);
    if (p) {
      setProfile(p);
      setUsername(p.username ?? "");
      setFullName(p.full_name ?? "");
      setBio(p.bio ?? "");
      setBabyName(p.baby_name ?? "");
      setBabyBirthDate(p.baby_birth_date ?? "");
      setAvatarUrl(p.avatar_url);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("auth.avatarUploadError"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("auth.avatarUploadError"));
      return;
    }
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(profile.id, file);
      setAvatarUrl(url);
      toast.success(t("auth.avatarUploadSuccess"));
    } catch (err) {
      console.error("❌ Avatar yükleme hatası:", err);
      toast.error(t("auth.avatarUploadError"));
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    if (!profile) return;
    if (!username.trim()) {
      toast.error(t("auth.profileUpdateError"));
      return;
    }
    setSaving(true);
    try {
      const updates: Record<string, string | null> = {
        username: username.trim() || null,
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        baby_name: babyName.trim() || null,
      };
      if (babyBirthDate) {
        updates.baby_birth_date = babyBirthDate;
      } else {
        updates.baby_birth_date = null;
      }
      await updateProfile(profile.id, updates);
      toast.success(t("auth.profileUpdated"));
    } catch (err) {
      console.error("❌ Profil güncelleme hatası:", err);
      toast.error(t("auth.profileUpdateError"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
        to="/auth/profile"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("auth.profile")}
      </Link>

      <h1 className="font-serif text-2xl">{t("auth.editProfile")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth.editProfileDesc")}</p>

      <div className="mt-8 flex items-center gap-6">
        <div className="relative">
          {avatarUrl ? (
            <a href={avatarUrl} target="_blank" rel="noopener noreferrer">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="h-28 w-28 rounded-2xl object-cover transition-transform hover:scale-105"
              />
            </a>
          ) : (
            <div className="grid h-28 w-28 place-items-center rounded-2xl bg-secondary text-accent">
              <User className="h-12 w-12" />
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-background bg-accent text-white shadow-md transition-colors hover:bg-accent/80 disabled:opacity-50"
            type="button"
          >
            {uploadingAvatar ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <div>
          <p className="font-medium">{profile.full_name || t("auth.profile")}</p>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      </div>

      <div className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("auth.username")}
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
            placeholder="@username"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("auth.name")}
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
            placeholder={t("auth.name")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("auth.bio")}
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
            placeholder={t("auth.bio")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("auth.babyName")}
          </label>
          <input
            type="text"
            value={babyName}
            onChange={(e) => setBabyName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
            placeholder={t("auth.babyName")}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {t("auth.babyBirthDate")}
          </label>
          <input
            type="date"
            value={babyBirthDate}
            onChange={(e) => setBabyBirthDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          type="button"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t("auth.saveProfile")}
        </button>
        <Link
          to="/auth/profile"
          className="flex-1 rounded-xl border border-border py-3 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("nav.home")}
        </Link>
      </div>
    </div>
  );
}
