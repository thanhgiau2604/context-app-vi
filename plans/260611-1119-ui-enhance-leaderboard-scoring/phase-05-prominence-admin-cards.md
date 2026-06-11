# Phase 05 — UI Prominence + Admin Card Sizing

**Priority:** Medium · **Status:** pending

## Problems

- **Point 3:** main UI components feel flat/sunken ("chìm"), need highlight on primary elements.
- **Point 4:** admin cards too small relative to overall layout — redesign bigger.

## Scope

UI-only, token-driven. No logic change. Read `DESIGN.md` (`game-card`, `game-glow`, `game-container`, `text-gradient-brand`, primary tokens) before editing.

### Prominence (point 3)

Target the primary gameplay surfaces in [game-page-layout.tsx](../../src/features/gameplay/round/game-page-layout.tsx):

- Guess input: make it the visual focal point — larger height, `game-glow` / ring on focus, stronger border.
- Active "current best rank" / header bar: elevate with `game-card` + subtle glow.
- Results board + leaderboard panels currently `bg-muted/10 border-border` (low contrast) → bump to `game-card` surface, stronger separation, section titles `text-sm font-semibold` → larger.
- Keep dark theme; no neon/rainbow. Use elevation + glow + contrast, not color noise.

### Admin cards (point 4)

[admin-panel-page.tsx](../../src/features/admin/panel/admin-panel-page.tsx): `Card` is `max-w-lg`, library rows + badges small.

- Increase card width (e.g. `max-w-2xl`), padding, control button sizes.
- Library list rows: larger row height, bigger font/badges, clearer status chips.
- Keep admin "slightly technical" theme per CLAUDE.md.
- Check other admin cards: `admin-settings`, `create-game` dialog for consistency (apply same sizing scale).

## Approach

Prefer reusable utility classes over per-component hex. If a shared "elevated panel" pattern repeats (results board + leaderboard + admin), consider a `game-card` variant already in `index.css` — DRY.

## Todo

- [ ] Read DESIGN.md prominence/elevation guidance
- [ ] Elevate guess input + header (focal glow)
- [ ] Upgrade results/leaderboard panels to `game-card` surfaces, larger titles
- [ ] Widen admin card + enlarge controls/rows/badges
- [ ] Consistency pass on other admin cards
- [ ] `npx tsc -b` clean; visual check

## Success Criteria

Primary gameplay elements visually dominant; admin cards larger and balanced with layout; all via tokens/utilities, no hard-coded hex, dark theme preserved.
