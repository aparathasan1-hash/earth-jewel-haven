import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, MessageCircle, Send, User } from "lucide-react";
import { useT } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  getRooms,
  getRoomMessages,
  sendMessage,
  type Room,
  type RoomMessage,
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
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
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
    if (!activeRoom) return;

    // Load initial messages
    getRoomMessages(activeRoom.id).then(setMessages);

    // Subscribe to realtime changes
    const subscription = supabase
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
          // Fetch the new message with profile data
          const { data } = await supabase
            .from("room_messages")
            .select("*, profiles(username, full_name)")
            .eq("id", payload.new.id)
            .single();
          if (data) {
            setMessages((prev) => [...prev, data as unknown as RoomMessage]);
          }
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!userId || !activeRoom || !newMessage.trim()) return;
    await sendMessage(activeRoom.id, userId, newMessage);
    setNewMessage("");
    const updated = await getRoomMessages(activeRoom.id);
    setMessages(updated);
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
                <p className="font-medium">{room.title}</p>
                {room.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{room.description}</p>
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
                <h2 className="font-serif text-lg">{activeRoom.title}</h2>
                {activeRoom.description && (
                  <p className="text-sm text-muted-foreground">{activeRoom.description}</p>
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
                      className={`flex gap-3 ${msg.user_id === userId ? "flex-row-reverse" : ""}`}
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs text-accent">
                        <User className="h-4 w-4" />
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.user_id === userId
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        }`}
                      >
                        <p className="text-xs font-medium text-muted-foreground">
                          {msg.profiles?.full_name || msg.profiles?.username || "Anonymous"}
                        </p>
                        <p className="mt-0.5 text-sm">{msg.content}</p>
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
                  className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground"
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
