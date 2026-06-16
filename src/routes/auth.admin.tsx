import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Shield, Users, Award, Crown, Star, BookOpen, Plus, Pencil, Trash2, X, Check, ShieldCheck, BadgeCheck, ExternalLink, Flag, EyeOff, Eye } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  getProfile,
  getAllUsers,
  getAllBadges,
  awardBadge,
  updateMembership,
  getVaultItems,
  createVaultItem,
  updateVaultItem,
  deleteVaultItem,
  getExpertApplications,
  getExpertDocUrl,
  approveExpertApplication,
  rejectExpertApplication,
  getPostReports,
  setPostHidden,
  dismissPostReport,
  deletePost,
  type Profile,
  type Badge,
  type VaultItemDB,
  type ExpertApplication,
  type PostReport,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/admin")({
  head: () => ({
    meta: [
      { title: "Admin — The Villageless Mama" },
      { name: "description", content: "Admin panel." },
    ],
  }),
  component: AdminPage,
});

type Tab = "users" | "badges" | "vault" | "experts" | "reports";

function AdminPage() {
  const t = useT();
  const [users, setUsers] = useState<Profile[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [vaultItems, setVaultItems] = useState<VaultItemDB[]>([]);
  const [expertApps, setExpertApps] = useState<ExpertApplication[]>([]);
  const [postReports, setPostReports] = useState<PostReport[]>([]);
  const [tab, setTab] = useState<Tab>("users");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showVaultForm, setShowVaultForm] = useState(false);
  const [editingVault, setEditingVault] = useState<VaultItemDB | null>(null);
  const [vaultForm, setVaultForm] = useState({
    title: "",
    type: "Essay" as "Essay" | "Printable" | "Audio" | "Course",
    tags: "",
    blurb: "",
    body: "",
    printable: "",
    audio_note: "",
    coming_soon: false,
    is_premium: false,
  });

  useEffect(() => {
    getCurrentUser().then(async (user) => {
      if (!user) return;
      // Check admin status from profiles table
      const profile = await getProfile(user.id);
      if (profile?.is_admin) {
        setIsAdmin(true);
        loadData();
      }
    });
  }, []);

  async function loadData() {
    const [u, b, v, e, r] = await Promise.all([
      getAllUsers(),
      getAllBadges(),
      getVaultItems(),
      getExpertApplications(),
      getPostReports(),
    ]);
    setUsers(u);
    setBadges(b);
    setVaultItems(v);
    setExpertApps(e);
    setPostReports(r);
  }

  async function handleToggleHidden(report: PostReport) {
    if (!report.posts) return;
    const next = !report.posts.is_hidden;
    try {
      await setPostHidden(report.post_id, next);
      setPostReports((prev) =>
        prev.map((r) =>
          r.post_id === report.post_id && r.posts
            ? { ...r, posts: { ...r.posts, is_hidden: next } }
            : r
        )
      );
      toast.success(next ? t("admin.postHidden") || "Post hidden" : t("admin.postShown") || "Post visible");
    } catch (e) {
      console.error(e);
      toast.error(t("common.error") || "Something went wrong");
    }
  }

  async function handleDeleteReportedPost(report: PostReport) {
    try {
      await deletePost(report.post_id);
      setPostReports((prev) => prev.filter((r) => r.post_id !== report.post_id));
      toast.success(t("admin.postDeleted") || "Post deleted");
    } catch (e) {
      console.error(e);
      toast.error(t("common.error") || "Something went wrong");
    }
  }

  async function handleDismissReport(reportId: string) {
    try {
      await dismissPostReport(reportId);
      setPostReports((prev) => prev.filter((r) => r.id !== reportId));
      toast.success(t("admin.reportDismissed") || "Report dismissed");
    } catch (e) {
      console.error(e);
      toast.error(t("common.error") || "Something went wrong");
    }
  }

  async function handleViewExpertDoc(path: string) {
    try {
      const url = await getExpertDocUrl(path);
      if (url) window.open(url, "_blank", "noopener");
    } catch (e) {
      console.error(e);
      toast.error("Belge açılamadı");
    }
  }

  async function handleApproveExpert(appId: string) {
    try {
      await approveExpertApplication(appId);
      toast.success("Uzman onaylandı 🌿");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Onaylanamadı");
    }
  }

  async function handleRejectExpert(appId: string) {
    const note = prompt("Red gerekçesi (opsiyonel):") ?? undefined;
    try {
      await rejectExpertApplication(appId, note);
      toast.success("Başvuru reddedildi");
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Reddedilemedi");
    }
  }

  async function handleAwardBadge(userId: string, badgeId: string) {
    try {
      await awardBadge(userId, badgeId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleGold(userId: string, current: string) {
    try {
      await updateMembership(userId, current === "gold" ? "free" : "gold");
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  function resetVaultForm() {
    setVaultForm({
      title: "",
      type: "Essay",
      tags: "",
      blurb: "",
      body: "",
      printable: "",
      audio_note: "",
      coming_soon: false,
      is_premium: false,
    });
    setEditingVault(null);
    setShowVaultForm(false);
  }

  function openEditVault(item: VaultItemDB) {
    setVaultForm({
      title: item.title,
      type: item.type,
      tags: item.tags.join(", "),
      blurb: item.blurb,
      body: (item.body || []).join("\n\n"),
      printable: (item.printable || []).join("\n"),
      audio_note: item.audio_note || "",
      coming_soon: item.coming_soon,
      is_premium: item.is_premium,
    });
    setEditingVault(item);
    setShowVaultForm(true);
  }

  async function handleSaveVault(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = {
        title: vaultForm.title,
        type: vaultForm.type,
        tags: vaultForm.tags.split(",").map((s) => s.trim()).filter(Boolean),
        blurb: vaultForm.blurb,
        body: vaultForm.body ? vaultForm.body.split("\n\n") : [],
        printable: vaultForm.printable ? vaultForm.printable.split("\n") : [],
      audio_note: vaultForm.audio_note || undefined,
        coming_soon: vaultForm.coming_soon,
        is_premium: vaultForm.is_premium,
      };

      if (editingVault) {
        await updateVaultItem(editingVault.id, data);
      } else {
        const user = await getCurrentUser();
        await createVaultItem({ ...data, created_by: user?.id });
      }
      resetVaultForm();
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteVault(id: string) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteVaultItem(id);
      loadData();
    } catch (e) {
      console.error(e);
    }
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-5 pt-12 text-center">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-2xl">{t("auth.adminTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("auth.adminDesc")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pt-8">
      <Link
        to="/auth/profile"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("auth.profile")}
      </Link>

      <h1 className="font-serif text-2xl">{t("auth.adminTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth.adminDesc")}</p>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setTab("users")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm transition-colors ${
            tab === "users"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" /> {t("auth.manageUsers")}
        </button>
        <button
          onClick={() => setTab("badges")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm transition-colors ${
            tab === "badges"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Award className="h-4 w-4" /> {t("auth.manageBadges")}
        </button>
        <button
          onClick={() => setTab("vault")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm transition-colors ${
            tab === "vault"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" /> Vault
        </button>
        <button
          onClick={() => setTab("experts")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm transition-colors ${
            tab === "experts"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-4 w-4" /> Experts
          {expertApps.some((a) => a.status === "pending") && (
            <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] text-accent-foreground">
              {expertApps.filter((a) => a.status === "pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("reports")}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm transition-colors ${
            tab === "reports"
              ? "bg-primary text-primary-foreground"
              : "border border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flag className="h-4 w-4" /> {t("admin.reports") || "Reports"}
          {postReports.length > 0 && (
            <span className="ml-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
              {postReports.length}
            </span>
          )}
        </button>
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <div className="mt-4 space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="font-medium">{user.full_name || "—"}</p>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  {t("auth.memberSince")}: {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleGold(user.id, user.membership_type)}
                  className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs ${
                    user.membership_type === "gold"
                      ? "border-amber-500 bg-amber-500/10 text-amber-500"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <Crown className="h-3 w-3" />
                  {user.membership_type === "gold" ? t("auth.gold") : t("auth.free")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Badges Tab */}
      {tab === "badges" && (
        <div className="mt-4 space-y-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <p className="font-medium">{badge.name}</p>
                  {badge.description && (
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {users.slice(0, 5).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAwardBadge(user.id, badge.id)}
                    className="rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
                    title={`Award to ${user.full_name || user.username}`}
                  >
                    <Star className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vault Tab */}
      {tab === "vault" && (
        <div className="mt-4">
          <button
            onClick={() => setShowVaultForm(true)}
            className="mb-4 flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add Vault Item
          </button>

          {/* Vault Form */}
          {showVaultForm && (
            <form onSubmit={handleSaveVault} className="mb-6 rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{editingVault ? "Edit" : "New"} Vault Item</h3>
                <button type="button" onClick={resetVaultForm} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Title</label>
                <input
                  value={vaultForm.title}
                  onChange={(e) => setVaultForm({ ...vaultForm, title: e.target.value })}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</label>
                  <select
                    value={vaultForm.type}
                    onChange={(e) => setVaultForm({ ...vaultForm, type: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
                  >
                    <option value="Essay">Essay</option>
                    <option value="Printable">Printable</option>
                    <option value="Audio">Audio</option>
                    <option value="Course">Course</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Tags (comma separated)</label>
                  <input
                    value={vaultForm.tags}
                    onChange={(e) => setVaultForm({ ...vaultForm, tags: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
                    placeholder="tag1, tag2"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Blurb</label>
                <input
                  value={vaultForm.blurb}
                  onChange={(e) => setVaultForm({ ...vaultForm, blurb: e.target.value })}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
                />
              </div>

              {vaultForm.type === "Essay" || vaultForm.type === "Course" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Body (paragraphs separated by blank line)</label>
                  <textarea
                    value={vaultForm.body}
                    onChange={(e) => setVaultForm({ ...vaultForm, body: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
              ) : vaultForm.type === "Printable" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Printable items (one per line)</label>
                  <textarea
                    value={vaultForm.printable}
                    onChange={(e) => setVaultForm({ ...vaultForm, printable: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
              ) : vaultForm.type === "Audio" ? (
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Audio Note</label>
                  <textarea
                    value={vaultForm.audio_note}
                    onChange={(e) => setVaultForm({ ...vaultForm, audio_note: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={vaultForm.coming_soon}
                    onChange={(e) => setVaultForm({ ...vaultForm, coming_soon: e.target.checked })}
                    className="rounded"
                  />
                  Coming Soon
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={vaultForm.is_premium}
                    onChange={(e) => setVaultForm({ ...vaultForm, is_premium: e.target.checked })}
                    className="rounded"
                  />
                  <Crown className="h-3.5 w-3.5 text-amber-500" /> Gold (premium)
                </label>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
              >
                <Check className="h-4 w-4" /> {editingVault ? "Update" : "Create"}
              </button>
            </form>
          )}

          {/* Vault Items List */}
          <div className="space-y-3">
            {vaultItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    {item.coming_soon && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500">Coming Soon</span>
                    )}
                    {item.is_premium && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-500">
                        <Crown className="h-3 w-3" /> Gold
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.type} · {item.tags?.join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.blurb}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditVault(item)}
                    className="rounded-xl border border-border p-2 text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVault(item.id)}
                    className="rounded-xl border border-border p-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            {vaultItems.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">No vault items yet. Add one above!</p>
            )}
          </div>
        </div>
      )}

      {/* Experts Tab */}
      {tab === "experts" && (
        <div className="mt-4 space-y-3">
          {expertApps.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">Henüz uzman başvurusu yok.</p>
          )}
          {expertApps.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-medium">
                    {a.full_name}
                    {a.status === "approved" && <BadgeCheck className="h-4 w-4 text-accent" />}
                  </p>
                  <p className="text-sm text-muted-foreground">{a.profession}</p>
                  <p className="text-[11px] text-muted-foreground">
                    @{a.profiles?.username || "user"} ·{" "}
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      a.status === "pending"
                        ? "bg-amber-500/15 text-amber-500"
                        : a.status === "approved"
                          ? "bg-accent/15 text-accent"
                          : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {a.status}
                  </span>
                  {a.review_note && (
                    <p className="mt-1 text-[11px] text-muted-foreground">Not: {a.review_note}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleViewExpertDoc(a.document_path)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:text-accent"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Belge
                  </button>
                  {a.status !== "approved" && (
                    <button
                      onClick={() => handleApproveExpert(a.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                    >
                      <Check className="h-3.5 w-3.5" /> Onayla
                    </button>
                  )}
                  {a.status !== "rejected" && (
                    <button
                      onClick={() => handleRejectExpert(a.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive"
                    >
                      <X className="h-3.5 w-3.5" /> Reddet
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reports Tab */}
      {tab === "reports" && (
        <div className="mt-4 space-y-3">
          {postReports.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              {t("admin.noReports") || "No reports. The feed is calm 🌿"}
            </p>
          ) : (
            postReports.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      {t("admin.reportedBy") || "Reported by"}{" "}
                      <span className="font-medium text-foreground">
                        {r.reporter?.full_name || r.reporter?.username || "—"}
                      </span>{" "}
                      · {new Date(r.created_at).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("admin.postBy") || "Post by"}{" "}
                      <span className="text-foreground">
                        {r.posts?.profiles?.full_name || r.posts?.profiles?.username || "—"}
                      </span>
                      {r.posts?.is_hidden && (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                          {t("admin.hidden") || "hidden"}
                        </span>
                      )}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-secondary/40 p-3 text-sm text-foreground">
                      {r.posts?.content || t("admin.postRemoved") || "(post removed)"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.posts && (
                    <button
                      onClick={() => handleToggleHidden(r)}
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-secondary/40"
                    >
                      {r.posts.is_hidden ? (
                        <>
                          <Eye className="h-3.5 w-3.5" /> {t("admin.unhide") || "Unhide"}
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5" /> {t("admin.hide") || "Hide"}
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteReportedPost(r)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {t("admin.deletePost") || "Delete post"}
                  </button>
                  <button
                    onClick={() => handleDismissReport(r.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary/40"
                  >
                    <Check className="h-3.5 w-3.5" /> {t("admin.dismiss") || "Dismiss"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
