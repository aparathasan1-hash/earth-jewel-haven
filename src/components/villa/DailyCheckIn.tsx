import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { saveMoodEntry } from "@/lib/auth";

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
};

const moods = [
  { value: 1, emoji: "😢", label: "Very Bad" },
  { value: 2, emoji: "😟", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Very Good" },
] as const;

export function DailyCheckIn({ open, onClose, userId }: Props) {
  const t = useT();
  const [selectedMood, setSelectedMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (selectedMood === null) {
      toast.error(t("common.selectMood") || "Please select a mood");
      return;
    }

    setSaving(true);
    try {
      await saveMoodEntry(userId, selectedMood, note || undefined);
      toast.success(t("common.moodSaved") || "Mood saved! 💫");
      setSelectedMood(null);
      setNote("");
      onClose();
    } catch (err) {
      console.error("Error saving mood:", err);
      toast.error(t("common.error") || "Error saving mood");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          {/* Panel */}
          <motion.div
            className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-card border border-border p-6 shadow-2xl"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-foreground">
                {t("common.howAreYouFeeling") || "How are you feeling today?"}
              </h2>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Mood Selector */}
            <div className="mb-6">
              <div className="grid grid-cols-5 gap-3 mb-4">
                {moods.map(({ value, emoji, label }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedMood(value)}
                    className={`flex flex-col items-center gap-2 rounded-2xl p-3 transition-all ${
                      selectedMood === value
                        ? "bg-accent text-accent-foreground scale-110"
                        : "bg-secondary/40 hover:bg-secondary text-muted-foreground"
                    }`}
                    title={label}
                  >
                    <span className="text-3xl">{emoji}</span>
                    <span className="text-xs hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
              {selectedMood && (
                <p className="text-xs text-muted-foreground text-center">
                  {moods.find((m) => m.value === selectedMood)?.label}
                </p>
              )}
            </div>

            {/* Optional Note */}
            <div className="mb-6">
              <label className="text-sm text-muted-foreground font-medium mb-2 block">
                {t("common.addNote") || "Add a note (optional)"}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                placeholder={t("common.notePlaceholder") || "What's on your mind?"}
                maxLength={200}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {note.length}/200
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary/40"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || selectedMood === null}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("common.saving") || "Saving"}
                  </>
                ) : (
                  t("common.save") || "Save"
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
