# CLAUDE.md — Contextto VI

Vietnamese word-guessing game (Contexto clone). Stack: **Vite + React + TypeScript + TailwindCSS v4 + shadcn/ui + Framer Motion + Zustand + Firebase**.

## Design Contract

**`DESIGN.md` is the single source of truth for all UI.** Read it before implementing any component.

Key rules:

- Use semantic tokens (`bg-background`, `text-foreground`, `bg-primary`, etc.) — never hard-code hex colors in components.
- Use game utility classes: `game-card`, `game-card-soft`, `game-container`, `game-glow`, `text-gradient-brand`.
- Guess result rows must use rank classes: `rank-exact`, `rank-ultra`, `rank-hot`, `rank-warm`, `rank-close`, `rank-cool`, `rank-far`, `rank-unknown`.
- Use `getRankClass(rank)` and `getRankLabel(rank)` helpers (see `DESIGN.md` §18) — don't duplicate this logic.
- Admin-only UI keeps the game theme but looks slightly more technical.
- Never reveal other players' guess words.

## Styling Stack

- **Tailwind v4** via `@tailwindcss/vite` plugin (no `tailwind.config.ts` needed).
- **shadcn/ui** (new-york style, Radix/Lucide). Components in `src/components/ui/`.
- **CSS vars** defined in `src/index.css`. Dark mode is always on (`html.dark`).
- Path alias `@/` → `src/`. Utils at `@/lib/tailwind-class-merge-utils`.

## Component Naming

Follow the folder structure in `DESIGN.md` §17:

```
src/components/
  ui/           # shadcn primitives (don't modify)
  layout/       # app-shell.tsx, game-container.tsx
  game/         # guess-input.tsx, guess-result-row.tsx, hint-card.tsx, leaderboard.tsx, ...
  admin/        # admin-settings-card.tsx, create-game-card.tsx, ...
```

## Icons

Use `lucide-react` only. See icon mapping table in `DESIGN.md` §11.

## Animation

Use `framer-motion`. Motion presets in `DESIGN.md` §10 (`fadeUp`, `scaleIn`, `listItem`). Keep animations under 500ms. No continuous full-screen animations.

## Tooling

- Package manager: **bun** / `vp` (vite-plus CLI).
- Add packages: `vp install <pkg>`.
- Run dev: `vp dev`.
- Lint/format/typecheck: `vp check`.

## Color Don'ts

- No red (`destructive`) for normal wrong guesses — only for end-game, give-up, or critical errors.
- No rainbow gradients, no heavy neon.
- No white background on main game screen.
