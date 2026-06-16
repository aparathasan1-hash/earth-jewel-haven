import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Loader2, Trash2, Globe, Users, Lock, User, Flag, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  getFeed,
  createPost,
  deletePost,
  reportPost,
  uploadChatMedia,
  type Post,
  type PostVisibility,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/feed")({
  head: () => ({
    meta: [
      { title: "Feed — The Villageless Mama" },
      { name: "description", content: "Shared moments from mothers like you." },
    ],
  }),
  component: FeedPage,
});

const visibilityMeta: Record<PostVisibility, { icon: typeof Globe; labelKey: string; fallback: string }> = {
  public: { icon: Globe, labelKey: "feed.visPublic", fallback: "Everyone" },
  friends: { icon: Users, labelKey: "feed.visFriends", fallback: "Friends" },
  private: { icon: Lock, labelKey: "feed.visPrivate", fallback: "Only me" },
};

function FeedPage() {
  const t = useT();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [posting, setPosting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const userIdRef = useRef("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const user = await getCurrentUser();
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      if (cancelled) return;
      setUserId(user.id);
      userIdRef.current = user.id;
      await refresh();
      if (!cancelled) setLoading(false);
    })();

    // Canlı akış: yeni paylaşım gelince listeyi tazele
    const channel = supabase
      .channel("posts-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const feed = await getFeed();
    setPosts(feed);
  }

  function handlePickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("chat.notImage") || "Please choose an image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("chat.tooLarge") || "Image is too large (max 10MB).");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  }

  async function handlePost() {
    const text = content.trim();
    if ((!text && !imageFile) || !userId) return;
    setPosting(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        imageUrl = await uploadChatMedia(userId, imageFile, "image", ext);
      }
      await createPost(userId, text, visibility, imageUrl);
      setContent("");
      clearImage();
      toast.success(t("feed.posted") || "Shared");
      await refresh();
    } catch (err) {
      console.error("❌ Post error:", err);
      toast.error(t("feed.postError") || "Could not share");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(postId: string) {
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      toast.success(t("feed.deleted") || "Deleted");
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error(t("feed.deleteError") || "Could not delete");
    }
  }

  async function handleReport(postId: string) {
    if (!userId) return;
    try {
      await reportPost(postId, userId, "");
      toast.success(t("feed.reported") || "Reported. Thank you — our team will review it.");
    } catch (err) {
      console.error("❌ Report error:", err);
      toast.error(t("common.error") || "Something went wrong");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

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
        <h1 className="font-serif text-2xl text-foreground">{t("feed.title") || "Feed"}</h1>
      </div>

      {/* Composer */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("feed.placeholder") || "Share a moment, a thought, a small win…"}
          maxLength={1000}
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />

        {imagePreview && (
          <div className="relative mt-2 inline-block">
            <img src={imagePreview} alt="" className="max-h-48 rounded-xl object-cover" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label={t("chat.cancel") || "Remove"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePickImage} />
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={posting}
              title={t("chat.photo") || "Photo"}
              aria-label={t("chat.photo") || "Photo"}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-accent hover:text-foreground disabled:opacity-50"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as PostVisibility)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="public">{t("feed.visPublic") || "Everyone"}</option>
              <option value="friends">{t("feed.visFriends") || "Friends only"}</option>
              <option value="private">{t("feed.visPrivate") || "Only me"}</option>
            </select>
          </div>
          <button
            onClick={handlePost}
            disabled={posting || (!content.trim() && !imageFile)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t("feed.share") || "Share"}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {t("feed.empty") || "No posts yet. Be the first to share."}
          </p>
        ) : (
          posts.map((post) => {
            const meta = visibilityMeta[post.visibility];
            const VisIcon = meta.icon;
            const isOwn = post.user_id === userId;
            return (
              <article key={post.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <Link to="/auth/user/$userId" params={{ userId: post.user_id }} className="shrink-0">
                    {post.profiles?.avatar_url ? (
                      <img
                        src={post.profiles.avatar_url}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-accent">
                        <User className="h-5 w-5" />
                      </span>
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to="/auth/user/$userId"
                        params={{ userId: post.user_id }}
                        className="text-sm font-medium hover:underline"
                      >
                        {post.profiles?.full_name || post.profiles?.username || "Anonymous"}
                      </Link>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <VisIcon className="h-3 w-3" /> {t(meta.labelKey) || meta.fallback}
                      </span>
                    </div>
                    {post.content && (
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                        {post.content}
                      </p>
                    )}
                    {post.image_url && (
                      <a href={post.image_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={post.image_url}
                          alt=""
                          className="mt-2 max-h-96 w-full rounded-xl object-cover"
                        />
                      </a>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <time className="text-[11px] text-muted-foreground">
                        {new Date(post.created_at).toLocaleString()}
                      </time>
                      {isOwn ? (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-destructive hover:underline"
                        >
                          <Trash2 className="h-3 w-3" /> {t("feed.delete") || "Delete"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReport(post.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
                          title={t("feed.report") || "Report"}
                        >
                          <Flag className="h-3 w-3" /> {t("feed.report") || "Report"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
