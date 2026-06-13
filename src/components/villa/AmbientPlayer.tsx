import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

const tracks = [
  { name: "Soft rain", desc: "A steady, quiet downpour.", src: "https://cdn.pixabay.com/audio/2022/03/15/audio_1718e49890.mp3" },
  { name: "Humming", desc: "Low, warm vocal hum.", src: "https://cdn.pixabay.com/audio/2024/02/15/audio_5d35610da6.mp3" },
  { name: "Rustling leaves", desc: "Wind through trees.", src: "https://cdn.pixabay.com/audio/2022/10/14/audio_c4f5f37c89.mp3" },
  { name: "White noise", desc: "Even, enveloping hush.", src: "https://cdn.pixabay.com/audio/2022/03/10/audio_270f49b81c.mp3" },
];

export function AmbientPlayer() {
  const [playing, setPlaying] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = (i: number) => {
    if (playing === i) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const a = new Audio(tracks[i].src);
    a.loop = true;
    a.volume = 0.6;
    a.play().catch(() => {});
    audioRef.current = a;
    setPlaying(i);
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {tracks.map((t, i) => {
        const active = playing === i;
        return (
          <button
            key={t.name}
            onClick={() => toggle(i)}
            className={`flex items-center gap-4 rounded-2xl border border-border px-4 py-4 text-left transition-colors min-h-14 ${active ? "bg-primary/15 border-primary/40" : "bg-card hover:bg-secondary/50"}`}
          >
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
              {active ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-0.5" />}
            </span>
            <span className="min-w-0">
              <span className="block font-serif text-lg">{t.name}</span>
              <span className="block text-sm text-muted-foreground">{t.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
