import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, FileText, Headphones, BookOpen, GraduationCap, ArrowLeft, Heart, Loader2, Lock, Crown } from "lucide-react";
import { toast } from "sonner";
import { SectionTitle, Paper } from "@/components/villa/Paper";
import { vaultItems, type VaultItem } from "@/lib/vault-content";
import { useT } from "@/lib/i18n";
import {
  getCurrentUser,
  getProfile,
  getVaultItems,
  getSavedVaultItemIds,
  saveVaultItem,
  unsaveVaultItem,
  type VaultItemDB,
} from "@/lib/auth";

// Admin'in eklediği DB öğesini statik VaultItem şekline çevir.
function dbToVaultItem(db: VaultItemDB): VaultItem {
  return {
    id: db.id,
    title: db.title,
    type: db.type,
    tags: db.tags ?? [],
    blurb: db.blurb,
    body: db.body?.length ? db.body : undefined,
    printable: db.printable?.length ? db.printable : undefined,
    audioNote: db.audio_note ?? undefined,
    comingSoon: db.coming_soon,
    premium: db.is_premium,
  };
}

export const Route = createFileRoute("/vault")({
  head: () => ({
    meta: [
      { title: "The Vault — The Villageless Mama" },
      {
        name: "description",
        content:
          "A searchable archive of essays, printables, audio, and courses for postpartum mothers.",
      },
      { property: "og:title", content: "The Vault" },
      { property: "og:description", content: "A quiet, searchable archive." },
      { property: "og:url", content: "/vault" },
    ],
    links: [{ rel: "canonical", href: "/vault" }],
  }),
  component: Vault,
});

const iconFor = (t: VaultItem["type"]) =>
  t === "Essay"
    ? BookOpen
    : t === "Printable"
      ? FileText
      : t === "Audio"
        ? Headphones
        : GraduationCap;

function VaultDetail({ item, onBack, isGold }: { item: VaultItem; onBack: () => void; isGold: boolean }) {
  const t = useT();
  const locked = Boolean(item.premium) && !isGold;
  return (
    <article className="animate-fade-up">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1 text-xs uppercase tracking-[0.22em] text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {t("vault.backLink")}
      </button>

      <Paper className="prose-book px-7 py-10 sm:px-12 sm:py-14">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-accent">
          {item.type}
          {item.premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-600 dark:text-amber-400">
              <Crown className="h-3 w-3" /> Gold
            </span>
          )}
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{item.title}</h1>
        <p className="mt-2 text-muted-foreground">{item.blurb}</p>

        {locked && (
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Lock className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-serif text-xl">{t("gold.lockedTitle") || "Gold members only"}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              {t("gold.lockedDesc") ||
                "This piece is part of the Gold collection. Unlock the full vault, premium audio, and courses."}
            </p>
            <Link
              to="/auth/gold"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Crown className="h-4 w-4" /> {t("gold.upgradeCta") || "Become Gold"}
            </Link>
          </div>
        )}

        {!locked && item.body?.map((p, i) => (
          <p key={i} className="mt-4 text-lg leading-relaxed">
            {p}
          </p>
        ))}

        {!locked && item.printable?.map((line, i) => (
          <p
            key={i}
            className="mt-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 font-serif text-lg"
          >
            {line}
          </p>
        ))}

        {!locked && item.audioNote && (
          <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-5">
            <p className="text-sm text-foreground">{item.audioNote}</p>
            <Link
              to="/stages/crisis"
              className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground"
            >
              {t("vault.openCrisisAudio")}
            </Link>
          </div>
        )}

        {!locked && item.comingSoon && (
          <p className="mt-6 text-sm italic text-muted-foreground">
            {t("vault.comingSoon")}
          </p>
        )}
      </Paper>
    </article>
  );
}

function Vault() {
  const t = useT();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isGold, setIsGold] = useState(false);
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
  const [allItems, setAllItems] = useState<VaultItem[]>(vaultItems);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    // Admin'in eklediği DB öğelerini statik içerikle birleştir (en-yeni-üstte DB).
    try {
      const dbItems = await getVaultItems();
      if (dbItems.length) setAllItems([...dbItems.map(dbToVaultItem), ...vaultItems]);
    } catch (err) {
      console.warn("DB vault items load failed (statik gösterilecek):", err);
    }

    try {
      const user = await getCurrentUser();
      if (user) {
        setUserId(user.id);
        const [savedIds, profile] = await Promise.all([
          getSavedVaultItemIds(user.id),
          getProfile(user.id),
        ]);
        setSavedItemIds(new Set(savedIds));
        setIsGold(profile?.membership_type === "gold");
      }
    } catch (err) {
      console.error("Error loading user:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleSave(itemId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!userId) {
      toast.error(t("common.loginRequired") || "Please log in to save items");
      return;
    }

    setSavingId(itemId);
    try {
      const isSaved = savedItemIds.has(itemId);
      if (isSaved) {
        await unsaveVaultItem(userId, itemId);
        setSavedItemIds((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        toast.success(t("vault.removedFromSaved") || "Removed from saved");
      } else {
        await saveVaultItem(userId, itemId);
        setSavedItemIds((prev) => new Set(prev).add(itemId));
        toast.success(t("vault.addedToSaved") || "Added to saved");
      }
    } catch (err) {
      console.error("Error saving item:", err);
      toast.error(t("common.error") || "Error saving item");
    } finally {
      setSavingId(null);
    }
  }

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return allItems;
    return allItems.filter((i) =>
      [i.title, i.blurb, i.type, ...i.tags].join(" ").toLowerCase().includes(s),
    );
  }, [q, allItems]);

  const selected = selectedId ? allItems.find((i) => i.id === selectedId) : null;

  if (selected) {
    return (
      <div className="mx-auto max-w-3xl px-5 pt-8">
        <VaultDetail item={selected} onBack={() => setSelectedId(null)} isGold={isGold} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pt-8">
      <SectionTitle
        eyebrow={t("vault.eyebrow")}
        title={t("vault.heading")}
        lede={t("vault.lede")}
      />

      <div className="sticky top-[68px] z-20 -mx-5 mb-6 bg-background/85 px-5 py-3 backdrop-blur-lg">
        <label className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3 shadow-sm">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("vault.searchPlaceholder")}
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            type="search"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="text-xs uppercase tracking-wider text-muted-foreground"
            >
              {t("vault.clearBtn")}
            </button>
          )}
        </label>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("vault.resultCount", { count: filtered.length, total: allItems.length })}
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((i) => {
          const Icon = iconFor(i.type);
          const isSaved = savedItemIds.has(i.id);
          const isSaving = savingId === i.id;
          return (
            <li key={i.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelectedId(i.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(i.id);
                  }
                }}
                className="animate-fade-up relative w-full cursor-pointer rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:bg-secondary/40"
              >
                <button
                  type="button"
                  onClick={(e) => handleToggleSave(i.id, e)}
                  disabled={isSaving}
                  className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-secondary disabled:opacity-50"
                  title={isSaved ? "Remove from saved" : "Save for later"}
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Heart
                      className={`h-5 w-5 transition-colors ${
                        isSaved ? "fill-destructive text-destructive" : "text-muted-foreground"
                      }`}
                    />
                  )}
                </button>
                <div className="flex items-start gap-4 pr-8">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-accent">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-accent">
                      {i.type}
                      {i.premium && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-amber-600 dark:text-amber-400">
                          {isGold ? <Crown className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />} Gold
                        </span>
                      )}
                    </p>
                    <h3 className="mt-1 font-serif text-lg leading-snug">{i.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{i.blurb}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {i.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="col-span-full rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            {t("vault.noResults", { query: q })}
          </li>
        )}
      </ul>
    </div>
  );
}
