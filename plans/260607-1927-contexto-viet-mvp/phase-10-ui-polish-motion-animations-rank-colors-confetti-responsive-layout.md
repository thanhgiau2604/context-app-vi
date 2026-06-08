# Phase 10 — UI Polish: Motion Animations, Rank Colors, Confetti & Responsive Layout

**Status:** ⬜ Todo  
**Priority:** Medium  
**Effort:** L (4–5h)  
**Requires:** Phase 06, 07, 08, 09 (polish after core stable)

---

## Overview

Apply Midnight Arena design system consistently. Add all Motion animations. Confetti on solve. Responsive layout for mobile. Polish every interaction.

---

## Design tokens already available (from `src/index.css`)

```css
--rank-exact, --rank-ultra, --rank-hot, --rank-warm
--rank-close, --rank-cool, --rank-far, --rank-unknown
--game-surface-1/2/3, --game-glow-primary, --game-glow-accent
--background, --foreground, --card, --primary, --accent
```

All mapped to Tailwind via `@theme inline`. Use `bg-rank-exact`, `text-game-surface-1`, etc.

---

## Animation inventory

| Trigger               | Animation                     | Motion API                                                            |
| --------------------- | ----------------------------- | --------------------------------------------------------------------- |
| Unknown word submit   | Input shake left-right        | `useAnimation` + `animate({ x: [-4,4,-4,0] })`                        |
| Valid guess appears   | Row slide-in from top         | `initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}`          |
| Hint card reveal      | 3D flip (Y-axis)              | `initial={{ rotateY:90 }} animate={{ rotateY:0 }}`                    |
| Solved                | Confetti burst                | `canvas-confetti` or Motion keyframes                                 |
| Solved overlay        | Scale + fade in               | `initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}` |
| Podium blocks         | Rise from bottom sequentially | `y: 80→0` with staggered delay                                        |
| Score bar             | Width expand                  | `animate={{ width: '${pct}%' }}`                                      |
| Results row appear    | Slide from right              | `initial={{ x:40, opacity:0 }}`                                       |
| Round transition      | Fade + scale                  | `exit={{ opacity:0, scale:0.95 }}`                                    |
| Toast notifications   | Slide from top-right          | shadcn Toaster (built-in)                                             |
| BestRank badge update | Pulse ring                    | `animate={{ scale:[1,1.15,1] }} transition={{ duration:0.3 }}`        |

---

## Files to create / update

### Install canvas-confetti

```bash
bun add canvas-confetti
bun add -d @types/canvas-confetti
```

### `src/features/gameplay/round/solved-confetti-effect.ts`

```ts
import confetti from "canvas-confetti";

export function fireSolvedConfetti() {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#f5c518", "#7c3aed", "#06b6d4", "#10b981"],
  });
}
```

---

### `src/components/ui/rank-badge.tsx`

Reusable badge showing rank number with tier color:

```tsx
import { getRankTier, rankTierColorClass } from "@/lib/utils/rank-color-classifier";
import { cn } from "@/lib/tailwind-class-merge-utils";

type Props = { rank: number | null; size?: "sm" | "md" | "lg" };

export function RankBadge({ rank, size = "md" }: Props) {
  const tier = getRankTier(rank);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-mono font-bold border tabular-nums",
        size === "sm" && "px-1.5 py-0.5 text-xs",
        size === "md" && "px-2 py-1 text-sm",
        size === "lg" && "px-3 py-1.5 text-base",
        rankTierColorClass[tier],
      )}
    >
      {rank === null ? "???" : `#${rank}`}
    </span>
  );
}
```

---

### `src/components/ui/game-card.tsx`

Glassmorphism card for game surfaces:

```tsx
export function GameCard({
  children,
  className,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-game-surface-1 backdrop-blur-md",
        glow && "shadow-[0_0_24px_var(--game-glow-primary)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
```

---

### Responsive layout strategy

Game page layout grid:

```
Mobile (< 768px):
  Stack vertically:
    RoundHeader → GuessInput → HintPanel → GuessHistory → ResultsBoard (collapsible)

Desktop (≥ 768px):
  Grid: [GuessArea 60%] | [ResultsBoard 40%]
  RoundHeader spans full width
```

```tsx
// game-page-layout.tsx responsive classes
<div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 h-full">
  <div className="flex flex-col gap-3">
    <RoundHeaderStatusBar />
    <GuessInputForm />
    <GuessHistoryList />
    <HintPanel />
  </div>
  <div className="hidden md:flex flex-col gap-3">
    <RealtimeRoundResultsBoard />
    <CumulativeLeaderboardPanel />
  </div>
</div>
```

Mobile: Results board as bottom sheet (shadcn `Sheet`).

---

### `src/features/gameplay/guess/guess-input-shake-animation.tsx`

```tsx
import { motion, useAnimation } from "motion/react";
import { useImperativeHandle, forwardRef } from "react";

export const ShakeWrapper = forwardRef<{ shake: () => void }, { children: React.ReactNode }>(
  ({ children }, ref) => {
    const controls = useAnimation();
    useImperativeHandle(ref, () => ({
      shake: async () => {
        await controls.start({ x: [-5, 5, -4, 4, -2, 0], transition: { duration: 0.35 } });
      },
    }));
    return <motion.div animate={controls}>{children}</motion.div>;
  },
);
```

---

### Font setup in `index.html`

Add Google Fonts (Be Vietnam Pro + JetBrains Mono) — already referenced in DESIGN.md:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link
  href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
  rel="stylesheet"
/>
```

---

## Polish checklist

- [ ] Install `canvas-confetti` + types
- [ ] Create `src/features/gameplay/round/solved-confetti-effect.ts`
- [ ] Create `src/components/ui/rank-badge.tsx`
- [ ] Create `src/components/ui/game-card.tsx`
- [ ] Create `src/features/gameplay/guess/guess-input-shake-animation.tsx`
- [ ] Add Google Fonts to `index.html`
- [ ] Add `AnimatePresence` wrapper to guess history list
- [ ] Add Motion to hint flip cards
- [ ] Add Motion to podium sequence (delay: 0, 0.3, 0.6)
- [ ] Add Motion to results board rows (slide from right)
- [ ] Add Motion to solved overlay (scale + fade)
- [ ] Add score bar width animation in leaderboard
- [ ] Wire `fireSolvedConfetti()` in solved flow
- [ ] Test mobile layout (375px width)
- [ ] Test desktop layout (1280px width)
- [ ] Test all animations with `prefers-reduced-motion` (skip animation)
- [ ] Verify rank colors match DESIGN.md spec across all tiers

---

## Success criteria

- All 8 animation triggers fire correctly
- Confetti plays on keyword solve
- Shake plays on unknown word
- Mobile: no horizontal overflow, results board accessible via sheet
- Desktop: two-column layout stable
- Font renders as "Be Vietnam Pro" (verify in DevTools)
- Colors pass Midnight Arena visual check against DESIGN.md
