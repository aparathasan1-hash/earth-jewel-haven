export function Logo({ size = 36 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
        <path
          d="M8 34 C 14 18, 22 14, 24 8 C 26 14, 34 18, 40 34 C 32 36, 16 36, 8 34 Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="text-accent"
        />
        <path d="M24 10 C 22 22, 22 32, 24 38" stroke="currentColor" strokeWidth="1.1" className="text-primary" fill="none" strokeLinecap="round" />
      </svg>
      <span className="font-serif text-[1.05rem] tracking-tight italic">The Villageless Mama</span>
    </span>
  );
}
