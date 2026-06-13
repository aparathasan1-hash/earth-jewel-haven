# The Villageless Mama — Build Plan

A sensory, book-like digital sanctuary for postpartum mothers. Editorial typography, earthy jewel palette, paper grain texture, bottom-anchored thumb navigation, soothing dark mode default, and absolutely no popups (no modals, no toasts, no cookie banners — everything resolves inline).

## Design System (src/styles.css)

**Palette (Earthy Jewels)** — oklch tokens for both modes; dark mode is the default (`<html class="dark">` set in root):

- `--background` Oatmeal `#F5F2EB` (light) / deep ink `#1C1915` (dark)
- `--foreground` River Stone / warm cream
- `--primary` Deep Moss Green
- `--accent` Burnt Sienna
- `--secondary` Muted Plum
- `--ochre`, `--river-stone` as named tokens

**Typography**: pair a serif display (Fraunces or Cormorant) with a humanist sans (Work Sans) — loaded via `<link>` in `__root.tsx`, declared in `@theme`. Base body 18px, line-height 1.75, max-w prose containers.

**Texture**: an SVG fractal-noise data URI applied as `::before` overlay on `body` (low opacity, blend-mode multiply) — gives the paper grain without an asset request.

**Tired-Eyes Mode**: dark mode is default. A floating bottom-right pill toggle (sun/moon) persists choice in `localStorage`. Additional "Softer" toggle dims contrast further.

## Routing (TanStack Start, file-based)

```
src/routes/
  __root.tsx              shell + bottom nav + theme toggle + grain overlay
  index.tsx               Landing / Welcome
  vault.tsx               The Vault hub + search
  stages.tsx              4th Trimester overview (layout: <Outlet/>)
  stages.recovery.tsx     Recovery Room
  stages.nursery.tsx      Nursery
  stages.crisis.tsx       Crisis Room (ambient audio + permission cards)
  stages.quiet.tsx        Quiet Room (breathing pacer)
  stages.support.tsx      Virtual Support Hand
  stages.mind.tsx         Mother's Mind essays
  privacy.tsx             Zero-tracking policy + Face ID toggle
  shop.tsx                Inline PDF delivery view
```

Each route has its own `head()` with unique title + description + og tags.

## Navigation (Thumb-Reach)

A fixed bottom nav bar (`fixed bottom-0`) with 5 primary destinations: Home · Vault · Stages · Quiet · Mind. Large 56px tap targets, icon + label, active state in moss green. Secondary nav (privacy, shop) reachable from landing footer and a small top-left menu. No hamburger drawers that obscure content; menus expand inline.

## Core Features

### 1. Landing (`/`)

- Editorial hero: serif headline, hand-drawn-feel SVG logomark placeholder.
- Welcome essay (ethos) typeset like a book opening.
- Inline cards linking to Substack and Pinterest (external links, open in new tab).
- "Take a Guide" buy section — clicking a guide swaps the card inline into an embedded PDF viewer (`<iframe>` to a sample PDF in `src/assets/`) with a download button. No checkout modal; the simulated purchase is instant and inline.

### 2. The Vault (`/vault`)

- Calm grid dashboard (bento-ish, paper cards with deckle-edge feel via SVG mask).
- Categories: Essays, Printables, Audio, Courses (coming soon).
- Persistent search input at top; filtering happens live against a typed `vaultItems` array. Searching "narcissistic family" filters across essays/printables/audio and shows a unified grid with type tags.
- Results render inline below the search — never in a popup.

### 3. 4th Trimester Stages (`/stages`)

- Overview shows 6 chapter cards. Each navigates to its own route.
- **Recovery Room**: gentle physical-healing checklists, day-by-day notes.
- **Nursery**: practical "rituals" cards (washing baby, fabric ritual, swaddle).
- **Crisis Room**:
  - Calming audio player component with 4 mocked tracks (rain, humming, rustling leaves, white noise) — uses short looping audio files in `src/assets/audio/` or `<audio>` with public CC0 samples; play/pause + volume only, no autoplay.
  - Quick troubleshooting accordion (baby won't latch, sudden tears, can't sleep).
  - "Permission Reminders" — large typeset cards ("You are allowed to rest.") that cycle on tap.
- **Quiet Room**: animated breathing pacer — an SVG circle that scales via Framer Motion on a 4-7-8 cycle (inhale 4s, hold 7s, exhale 8s), with caption text that fades in sync. Start/stop only.
- **Virtual Support Hand**: clean booking UI for "30-min quiet co-working call" — date/time picker, simple form, on submit shows an inline confirmation card (no toast).
- **Mother's Mind**: essay index + reader; each essay is a long-form route-rendered page with drop caps and pull quotes.

### 4. Privacy (`/privacy`)

- "Zero Data Tracking" badge (SVG seal) prominently displayed.
- Plain-language policy.
- **Face ID / Secure Lock toggle**: when enabled (stored in `localStorage`), an inline lock screen renders over private routes (Mind, Crisis) requiring a tap-to-unlock gesture (simulated bio prompt — inline panel, not a modal). State managed via a small Zustand store.

## State Management

- Zustand store: `theme`, `softerMode`, `secureLockEnabled`, `unlocked`, `audioState`.
- TanStack Query already wired; not heavily needed (no backend) but used for any future fetch.

## Components to Build

- `BottomNav`, `TopBar` (minimal)
- `ThemeToggle`, `SofterToggle`
- `GrainOverlay`
- `Logo` (inline SVG hand-drawn placeholder)
- `VaultSearch`, `VaultCard`
- `BreathingPacer` (Framer Motion)
- `AmbientPlayer` (audio component with 4 tracks)
- `PermissionCard` (cycling reminders)
- `PDFViewer` (inline iframe)
- `SecureLockGate` (wraps private routes)
- `PrivacyBadge`
- `EssayLayout` (drop cap, prose styles)

## Dependencies

- Add: `framer-motion`, `zustand`, `lucide-react` (likely already present).

## Technical Notes

- All interactive overlays are **inline panels**, not Radix Dialogs. No `sonner` toasts. Confirmation messages render as inline cards near the action.
- Audio files: bundle 4 short royalty-free loops (~30–60s) in `src/assets/audio/` or use CC0 URLs from `cdn.pixabay.com` referenced directly.
- Accessibility: `aria-label` on all icon buttons; `prefers-reduced-motion` respected by breathing pacer; min 44px tap targets; high-contrast tokens.
- SEO: per-route `head()` metadata, single `<main>` in root, semantic headings.

## Out of Scope (this build)

- Real auth, real payments, real backend (Lovable Cloud not enabled — request says "simulated").
- Real Face ID API integration (simulated UI only).

Ready to build on approval.
