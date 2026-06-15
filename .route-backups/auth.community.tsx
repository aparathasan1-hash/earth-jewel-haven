import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, MessageCircle, Send, User, MoreVertical, Loader2, Trash2, Edit2, Lock } from "lucide-react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  getCurrentUser,
  getRooms,
  getRoomMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getRoomDetails,
  type Room,
  type RoomMessage,
  type RoomDetailedInfo,
} from "@/lib/auth";

export const Route = createFileRoute("/auth/community")({
  head: () => ({
    meta: [
      { title: "Community — The Villageless Mama" },
      { name: "description", content: "Quiet rooms created by mothers like you." },
    ],
  }),
  validateSearch: (search: Record<string, string>) => ({
    roomId: search.roomId,
  }),
  component: CommunityPage,
});

function CommunityPage() {
  const t = useT();
  const navigate = useNavigate();
  const search = Route.useSearch() as { roomId?: string };
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [roomDetails, setRoomDetails] = useState<RoomDetailedInfo | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!user) {
        navigate({ to: "/auth/login" });
        return;
      }
      setUserId(user.id);
    });
    getRooms().then((rooms) => {
      setRooms(rooms);
      if (search?.roomId) {
        const room = rooms.find((r) => r.id === search.roomId);
        if (room) setActiveRoom(room);
      }
    });
  }, [navigate, search?.roomId]);

  useEffect(() => {
    if (!activeRoom) {
      setRoomDetails(null);
      return;
    }

    getRoomDetails(activeRoom.id).then((details) => {
      if (details) setRoomDetails(details);
    });

    // Load initial messages
    getRoomMessages(activeRoom.id).then(setMessages);

    // Subscribe to realtime changes (INSERT)
    const insertSubscription = supabase
      .channel(`room_messages:${activeRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${activeRoom.id}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("room_messages")
            .select("*, profiles(username, full_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setMessages((prev) => [...prev, data as unknown as RoomMessage]);
          }
        },
      )
      .subscribe();

    // Subscribe to realtime changes (UPDATE - for message edits)
    const updateSubscription = supabase
      .channel(`room_messages_update:${activeRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${activeRoom.id}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id
                ? { ...msg, content: payload.new.content, edited_at: payload.new.edited_at }
                : msg
            )
          );
        },
      )
      .subscribe();

    // Subscribe to realtime changes (DELETE)
    const deleteSubscription = supabase
      .channel(`room_messages_delete:${activeRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${activeRoom.id}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
        },
      )
      .subscribe();

    return () => {
      insertSubscription.unsubscribe();
      updateSubscription.unsubscribe();
      deleteSubscription.unsubscribe();
    };
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!userId || !activeRoom || !newMessage.trim()) return;
    try {
      await sendMessage(activeRoom.id, userId, newMessage);
      setNewMessage("");
      const updated = await getRoomMessages(activeRoom.id);
      setMessages(updated);
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error(t("common.error") || "Error sending message");
    }
  }

  async function handleEditMessage(messageId: string) {
    if (!editingContent.trim()) return;
    setIsEditLoading(true);
    try {
      await editMessage(messageId, userId!, editingContent);
      setEditingMessageId(null);
      setEditingContent("");
      toast.success(t("common.messageSaved") || "Message updated");
    } catch (err) {
      console.error("Error editing message:", err);
      toast.error(t("common.error") || "Error updating message");
    } finally {
      setIsEditLoading(false);
    }
  }

  async function handleDeleteMessage(messageId: string) {
    try {
      await deleteMessage(messageId, userId!);
      setDeleteConfirmId(null);
      toast.success(t("common.deleted") || "Message deleted");
    } catch (err) {
      console.error("Error deleting message:", err);
      toast.error(t("common.error") || "Error deleting message");
    }
  }

  function formatDate(date: string): string {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "today";
    if (d.toDateString() === yesterday.toDateString()) return "yesterday";

    const weeks = Math.floor((today.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000));
    if (weeks < 4) return `${weeks}w ago`;

    return d.toLocaleDateString();
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col px-5 pt-8">
      <Link
        to="/auth/profile"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("auth.profile")}
      </Link>

      <h1 className="font-serif text-2xl">{t("auth.communityTitle")}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{t("auth.communityDesc")}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Room list */}
        <div className="space-y-2">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {t("auth.rooms")}
          </h2>
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("auth.createRoom")}</p>
          ) : (
            rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  activeRoom?.id === room.id
                    ? "border-accent bg-secondary"
                    : "border-border bg-card hover:bg-secondary/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="font-medium flex-1 truncate">{room.title}</p>
                  {room.is_private && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                </div>
                {room.description && (
                  <p className="mt-1 text-sm text-muted-foreground truncate">{room.description}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {room.profiles?.full_name || room.profiles?.username || "Anonymous"}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="flex flex-col">
          {activeRoom ? (
            <>
              <div className="mb-4 rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-lg">{activeRoom.title}</h2>
                      {activeRoom.is_private && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {activeRoom.description && (
                      <p className="text-sm text-muted-foreground mt-1">{activeRoom.description}</p>
                    )}
                  </div>
                </div>
                {roomDetails && (
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Created {formatDate(roomDetails.created_at)}</span>
                    <span>👥 {roomDetails.memberCount} {roomDetails.memberCount === 1 ? "member" : "members"}</span>
                    {roomDetails.isOwner && <span className="font-medium text-accent">Owner</span>}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 min-h-[300px] max-h-[400px]">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    {t("auth.messagePlaceholder")}
                  </p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      onMouseEnter={() => setHoveredMessageId(msg.id)}
                      onMouseLeave={() => setHoveredMessageId(null)}
                      className={`flex gap-3 group ${msg.user_id === userId ? "flex-row-reverse" : ""}`}
                    >
                      {/* Avatar or User icon */}
                      {msg.profiles?.avatar_url ? (
                        <Link
                          to={`/auth/user/${msg.user_id}`}
                          className="shrink-0 rounded-full overflow-hidden hover:ring-2 hover:ring-accent transition-all"
                        >
                          <img
                            src={msg.profiles.avatar_url}
                            alt={msg.profiles.username || "User"}
                            className="h-8 w-8 object-cover"
                          />
                        </Link>
                      ) : (
                        <Link
                          to={`/auth/user/${msg.user_id}`}
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs text-accent hover:bg-secondary/80 transition-colors"
                        >
                          <User className="h-4 w-4" />
                        </Link>
                      )}

                      {/* Message content */}
                      <div className="relative max-w-[80%]">
                        {editingMessageId === msg.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditMessage(msg.id)}
                                disabled={isEditLoading}
                                className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                              >
                                {isEditLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                                Save
                              </button>
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="px-3 py-1 rounded-lg border border-border text-xs font-medium hover:bg-secondary/40"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              msg.user_id === userId
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-foreground"
                            }`}
                          >
                            <Link
                              to={`/auth/user/${msg.user_id}`}
                              className="text-xs font-medium hover:underline"
                              style={{
                                color: msg.user_id === userId ? "inherit" : "var(--color-accent)",
                              }}
                            >
                              {msg.profiles?.full_name || msg.profiles?.username || "Anonymous"}
                            </Link>
                            <p className="mt-0.5 text-sm break-words">{msg.content}</p>
                            {msg.edited_at && (
                              <p className="text-xs opacity-70 mt-1">edited</p>
                            )}
                          </div>
                        )}

                        {/* Message actions menu */}
                        {msg.user_id === userId && hoveredMessageId === msg.id && editingMessageId !== msg.id && (
                          <div className="absolute -right-8 top-0 flex gap-1">
                            <button
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditingContent(msg.content);
                              }}
                              className="p-1 rounded-lg hover:bg-secondary/40 transition-colors"
                              title="Edit message"
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(msg.id)}
                              className="p-1 rounded-lg hover:bg-secondary/40 transition-colors"
                              title="Delete message"
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </div>
                        )}

                        {/* Delete confirmation */}
                        {deleteConfirmId === msg.id && (
                          <div className="absolute top-0 right-0 bg-card border border-border rounded-lg p-2 shadow-md">
                            <p className="text-xs text-muted-foreground mb-2">Delete?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="px-2 py-1 rounded bg-destructive text-destructive-foreground text-xs font-medium hover:bg-destructive/90"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 rounded border border-border text-xs font-medium hover:bg-secondary/40"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={t("auth.messagePlaceholder")}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                />
                <button
                  onClick={handleSend}
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-border bg-card">
              <div className="text-center">
                <MessageCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("auth.joinRoom")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
