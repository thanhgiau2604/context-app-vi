# DESIGN.md — Vietnamese Context Game UI Design System

> Project: Vietnamese word-guessing game website, similar to Contexto  
> Target stack: **Vite + React + TailwindCSS + shadcn/ui + Framer Motion + Zustand + Firebase**  
> Purpose of this file: establish a "design contract" so that developers or AI coding assistants keep the UI consistent throughout the project.

---

## 1. Design Direction

### 1.1. Product spirit

The game should feel:

- **Modern**: clean interface, generous whitespace, well-defined components.
- **Subtly premium**: dark background, soft glass/card surfaces, refined gradient lighting.
- **Engaging for players**: smooth animations, fast feedback, colors that shift with how close a guess is.
- **Not garish**: avoid excessive neon, avoid competing colors that clash.
- **Clear in realtime multiplayer**: players can see the round state, scores, leaderboard, and who has finished — but cannot see other players' guesses.

### 1.2. Design keywords

```txt
midnight, premium, clever, energetic, Vietnamese, competitive, cinematic, glass, motion
```

### 1.3. What NOT to do

- Do not use a fully white background for the main game screen.
- Do not use excessive rainbow gradients.
- Do not use red/blue that is too loud over large areas.
- Do not let animations slow down the guessing flow.
- Do not use fonts that are too "gaming" and hard to read in Vietnamese.
- Do not make the UI look like a stiff enterprise dashboard.

---

## 2. Visual Identity

### 2.1. Concept

Main theme: **Midnight Arena**

Players enter a dark, elegant "vocabulary arena" with violet/cyan highlights as accents. Every guess is a "scan" into the word space. The closer a word is to the answer, the warmer and more prominent its color.

### 2.2. Text moodboard

```txt
Background: dark blue-black / charcoal violet
Surface: frosted glass, lightly elevated cards
Accent: violet + cyan
Win color: amber/gold
Success: emerald
Danger: rose
Text: ivory white, light slate
Motion: gentle spring, quick reveal, subtle pulse
```

---

## 3. Tailwind / shadcn Theme Tokens

### 3.1. Token principles

Use **semantic tokens** instead of hard-coding colors directly.

Preferred:

```tsx
<div className="bg-background text-foreground" />
<Button className="bg-primary text-primary-foreground" />
```

Avoid scattering:

```tsx
<div className="bg-[#080B1A] text-[#F8FAFC]" />
```

Only use direct color values when prototyping quickly; they must be moved to tokens afterward.

---

## 4. CSS Variables for `src/index.css` or `src/globals.css`

> Compatible for direct use with shadcn/ui.  
> Palette uses OKLCH for colors that look modern, soft, and scale better.  
> Note: `--game-surface-1/2/3` and `--game-glow-primary/accent` mappings have been added to the `@theme inline` block in `src/index.css`.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  color-scheme: dark;

  --radius: 1rem;

  /* Base */
  --background: oklch(0.145 0.035 265);
  --foreground: oklch(0.985 0.006 255);

  --card: oklch(0.19 0.04 265 / 0.82);
  --card-foreground: oklch(0.985 0.006 255);

  --popover: oklch(0.18 0.04 265);
  --popover-foreground: oklch(0.985 0.006 255);

  /* Brand */
  --primary: oklch(0.68 0.18 292);
  --primary-foreground: oklch(0.99 0.006 255);

  --secondary: oklch(0.28 0.055 260);
  --secondary-foreground: oklch(0.94 0.012 255);

  --accent: oklch(0.78 0.13 205);
  --accent-foreground: oklch(0.13 0.03 260);

  --muted: oklch(0.245 0.04 260);
  --muted-foreground: oklch(0.72 0.025 255);

  /* Semantic */
  --destructive: oklch(0.64 0.22 25);
  --destructive-foreground: oklch(0.99 0.006 255);

  --success: oklch(0.72 0.16 155);
  --success-foreground: oklch(0.12 0.03 155);

  --warning: oklch(0.82 0.17 78);
  --warning-foreground: oklch(0.16 0.04 78);

  --info: oklch(0.76 0.13 220);
  --info-foreground: oklch(0.12 0.03 250);

  /* Border / Input / Ring */
  --border: oklch(0.33 0.045 265 / 0.75);
  --input: oklch(0.255 0.04 265);
  --ring: oklch(0.72 0.15 292);

  /* Game rank colors */
  --rank-exact: oklch(0.86 0.18 88);
  --rank-ultra: oklch(0.78 0.16 72);
  --rank-hot: oklch(0.72 0.18 38);
  --rank-warm: oklch(0.72 0.16 145);
  --rank-close: oklch(0.74 0.13 198);
  --rank-cool: oklch(0.65 0.12 258);
  --rank-far: oklch(0.54 0.07 270);
  --rank-unknown: oklch(0.42 0.025 260);

  /* Game surfaces */
  --game-glow-primary: oklch(0.68 0.18 292 / 0.34);
  --game-glow-accent: oklch(0.78 0.13 205 / 0.22);
  --game-surface-1: oklch(0.18 0.04 265 / 0.72);
  --game-surface-2: oklch(0.23 0.045 265 / 0.66);
  --game-surface-3: oklch(0.3 0.055 265 / 0.52);

  /* Charts / leaderboard */
  --chart-1: oklch(0.82 0.17 78);
  --chart-2: oklch(0.76 0.13 205);
  --chart-3: oklch(0.68 0.18 292);
  --chart-4: oklch(0.72 0.16 155);
  --chart-5: oklch(0.65 0.16 25);
}

.dark {
  color-scheme: dark;
}

/* Tailwind v4 theme mapping */
@theme inline {
  --font-sans: "Be Vietnam Pro", "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "SFMono-Regular", ui-monospace, monospace;

  --radius-sm: calc(var(--radius) - 6px);
  --radius-md: calc(var(--radius) - 4px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 10px);

  --color-background: var(--background);
  --color-foreground: var(--foreground);

  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);

  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);

  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);

  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);

  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);

  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);

  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);

  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);

  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);

  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-rank-exact: var(--rank-exact);
  --color-rank-ultra: var(--rank-ultra);
  --color-rank-hot: var(--rank-hot);
  --color-rank-warm: var(--rank-warm);
  --color-rank-close: var(--rank-close);
  --color-rank-cool: var(--rank-cool);
  --color-rank-far: var(--rank-far);
  --color-rank-unknown: var(--rank-unknown);

  /* Game surface mappings — added in src/index.css */
  --color-game-surface-1: var(--game-surface-1);
  --color-game-surface-2: var(--game-surface-2);
  --color-game-surface-3: var(--game-surface-3);
  --color-game-glow-primary: var(--game-glow-primary);
  --color-game-glow-accent: var(--game-glow-accent);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  html {
    @apply dark;
  }

  body {
    @apply min-h-screen bg-background text-foreground antialiased;
    background:
      radial-gradient(circle at 20% 10%, var(--game-glow-primary), transparent 34rem),
      radial-gradient(circle at 80% 20%, var(--game-glow-accent), transparent 30rem),
      linear-gradient(
        135deg,
        oklch(0.12 0.04 265),
        oklch(0.17 0.035 245) 48%,
        oklch(0.12 0.035 280)
      );
  }

  ::selection {
    background: color-mix(in oklch, var(--primary) 55%, transparent);
    color: var(--foreground);
  }
}

@layer utilities {
  .game-container {
    @apply mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8;
  }

  .game-card {
    @apply rounded-2xl border border-white/10 bg-card/80 shadow-2xl backdrop-blur-xl;
  }

  .game-card-soft {
    @apply rounded-2xl border border-white/10 bg-white/[0.045] shadow-xl backdrop-blur-md;
  }

  .game-glow {
    box-shadow:
      0 0 0 1px color-mix(in oklch, var(--primary) 20%, transparent),
      0 18px 80px color-mix(in oklch, var(--primary) 20%, transparent);
  }

  .text-gradient-brand {
    @apply bg-gradient-to-r from-primary via-accent to-rank-exact bg-clip-text text-transparent;
  }

  .rank-exact {
    @apply border-rank-exact/50 bg-rank-exact/15 text-rank-exact;
  }

  .rank-ultra {
    @apply border-rank-ultra/50 bg-rank-ultra/15 text-rank-ultra;
  }

  .rank-hot {
    @apply border-rank-hot/50 bg-rank-hot/15 text-rank-hot;
  }

  .rank-warm {
    @apply border-rank-warm/50 bg-rank-warm/15 text-rank-warm;
  }

  .rank-close {
    @apply border-rank-close/50 bg-rank-close/15 text-rank-close;
  }

  .rank-cool {
    @apply border-rank-cool/50 bg-rank-cool/15 text-rank-cool;
  }

  .rank-far {
    @apply border-rank-far/50 bg-rank-far/15 text-rank-far;
  }

  .rank-unknown {
    @apply border-rank-unknown/50 bg-rank-unknown/15 text-muted-foreground;
  }
}
```

---

## 5. Tailwind v3 fallback

> **Note:** This project uses Tailwind v4. Section 5 is kept for reference only, in case the project is migrated to or compared with a Tailwind v3 setup.

If the project uses Tailwind v3, you can keep the CSS variables in `globals.css` and map them in `tailwind.config.ts`.

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Be Vietnam Pro", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 6px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 10px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          foreground: "var(--warning-foreground)",
        },
        info: {
          DEFAULT: "var(--info)",
          foreground: "var(--info-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        rank: {
          exact: "var(--rank-exact)",
          ultra: "var(--rank-ultra)",
          hot: "var(--rank-hot)",
          warm: "var(--rank-warm)",
          close: "var(--rank-close)",
          cool: "var(--rank-cool)",
          far: "var(--rank-far)",
          unknown: "var(--rank-unknown)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 6. Typography

### 6.1. Primary font

Recommended:

```txt
Primary font: Be Vietnam Pro
Fallback: Inter, system-ui, sans-serif
Mono: JetBrains Mono
```

Rationale:

- `Be Vietnam Pro` has excellent Vietnamese character support.
- Modern, legible letterforms that suit both game UI and admin dashboards.
- `Inter` is a reliable fallback.

### 6.2. Type scale

| Role          | Suggested class                                              | Usage                  |
| ------------- | ------------------------------------------------------------ | ---------------------- |
| Hero title    | `text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight` | Landing / waiting room |
| Page title    | `text-2xl sm:text-3xl font-bold tracking-tight`              | Game screen / admin    |
| Section title | `text-lg sm:text-xl font-semibold`                           | Card title             |
| Body          | `text-sm sm:text-base leading-7`                             | General content        |
| Caption       | `text-xs text-muted-foreground`                              | Metadata               |
| Number/rank   | `font-mono tabular-nums`                                     | Rank, score, timer     |

### 6.3. Vietnamese text rules

- Do not uppercase entire sentences in Vietnamese.
- Uppercase only short labels such as `ROUND`, `SCORE`, `HINT`.
- Guessed keywords should use a higher font weight; avoid overly wide letter spacing.

---

## 7. Color Usage

### 7.1. Base colors

| Purpose          | Token                                    | Usage                  |
| ---------------- | ---------------------------------------- | ---------------------- |
| App background   | `bg-background`                          | Full app               |
| Main text        | `text-foreground`                        | Primary text           |
| Secondary text   | `text-muted-foreground`                  | Descriptions, metadata |
| Card             | `bg-card`                                | Primary card           |
| Soft panel       | `bg-white/[0.045]`                       | Secondary panel        |
| Border           | `border-border` or `border-white/10`     | Soft borders           |
| Primary action   | `bg-primary text-primary-foreground`     | Primary button         |
| Secondary action | `bg-secondary text-secondary-foreground` | Secondary button       |
| Accent highlight | `text-accent`                            | Small icons/highlights |

### 7.2. Game rank colors

Guess colors must reflect how close a word is to the answer.

| Rank / Distance | Meaning               | Class          |
| --------------: | --------------------- | -------------- |
|             `1` | Correct answer        | `rank-exact`   |
|         `2 - 5` | Extremely close       | `rank-ultra`   |
|        `6 - 20` | Very hot              | `rank-hot`     |
|      `21 - 100` | Related, earns points | `rank-warm`    |
|     `101 - 300` | Somewhat close        | `rank-close`   |
|     `301 - 700` | Moderately far        | `rank-cool`    |
|    `701 - 1000` | Very far              | `rank-far`     |
|     Not in list | Not in the word map   | `rank-unknown` |

### 7.3. Colors to avoid

- Do not use red for a normal wrong guess; the game should not feel punishing.
- Red/rose is reserved for:
  - End game
  - Giving up
  - Critical errors
  - Invalid actions

---

## 8. Layout System

### 8.1. App shell

```tsx
<main className="min-h-screen overflow-hidden">
  <div className="game-container py-6 sm:py-10">{children}</div>
</main>
```

### 8.2. Responsive breakpoints

| Screen        | Strategy                                           |
| ------------- | -------------------------------------------------- |
| Mobile        | 1 column, guess input sticky at or near the bottom |
| Tablet        | 1 wider column, leaderboard below                  |
| Desktop       | 2 columns: main game + leaderboard/status          |
| Large desktop | Max width `6xl`, not stretched too wide            |

### 8.3. Game screen layout

Desktop:

```txt
┌──────────────────────────────────────────────┐
│ Header: room code, round, timer, admin/user   │
├──────────────────────────────┬───────────────┤
│ Main game card                │ Side panel    │
│ - keyword hidden              │ - leaderboard │
│ - guess input                 │ - players     │
│ - hints                       │ - round info  │
│ - guess history               │               │
└──────────────────────────────┴───────────────┘
```

Mobile:

```txt
Header
Round status
Guess input
Hints
Guess history
Leaderboard collapsed / tabs
```

---

## 9. Component Design

## 9.1. Button

### Primary button

Use for important actions:

- Create New Game
- Start Game
- Submit Guess
- Next Round
- Join Room

```tsx
<Button className="rounded-xl bg-primary px-5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.01] hover:bg-primary/90 active:scale-[0.98]">
  Create New Game
</Button>
```

### Secondary button

Use for secondary actions:

```tsx
<Button variant="secondary" className="rounded-xl border border-white/10 bg-secondary/80">
  Copy Room ID
</Button>
```

### Danger button

Use for give up / end game:

```tsx
<Button variant="destructive" className="rounded-xl">
  Give Up
</Button>
```

---

## 9.2. Game card

```tsx
<section className="game-card game-glow p-4 sm:p-6">
  <div className="mb-5 flex items-center justify-between gap-3">
    <h2 className="text-xl font-bold">Current Round</h2>
    <Badge className="bg-primary/15 text-primary">LIVE</Badge>
  </div>

  {children}
</section>
```

Visual:

- Soft border.
- Backdrop blur.
- Large shadow, not too harsh.
- Card background slightly darker than the app background.

---

## 9.3. Guess input

The input is the center of the game and must stand out.

```tsx
<form className="relative">
  <Input
    className="h-14 rounded-2xl border-white/10 bg-white/[0.06] px-5 pr-14 text-base font-semibold shadow-inner placeholder:text-muted-foreground focus-visible:ring-primary/60"
    placeholder="Enter a Vietnamese word..."
  />

  <Button size="icon" className="absolute right-2 top-2 size-10 rounded-xl bg-primary">
    <Send className="size-4" />
  </Button>
</form>
```

Rules:

- Input focus ring must be clearly visible.
- Press Enter to submit.
- While checking the guess, show a small spinner on the button.
- If the word is not in the top-1000 list, show a light toast; do not add it to the history.

---

## 9.4. Guess result row

```tsx
<div className="rank-warm flex items-center justify-between rounded-xl border px-4 py-3">
  <div className="min-w-0">
    <p className="truncate font-semibold">trường học</p>
    <p className="text-xs opacity-75">Related</p>
  </div>

  <div className="font-mono text-lg font-black tabular-nums">#84</div>
</div>
```

### Rank row behavior

| Case                      | Behavior                     |
| ------------------------- | ---------------------------- |
| New guess                 | Row slides in from below     |
| Better than previous best | Glow pulse once              |
| Rank <= 100               | Micro text: "Getting close!" |
| Rank <= 20                | Flame/spark icon             |
| Rank = 1                  | Victory animation            |

---

## 9.5. Hint card

Each player gets a maximum of 3 hints.

```tsx
<button className="game-card-soft group flex min-h-24 flex-col items-start justify-between p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/10">
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <Sparkles className="size-4 text-accent" />
    Hint #1
  </div>

  <div className="text-lg font-bold">Reveal hint</div>

  <div className="text-xs text-warning">-5 points</div>
</button>
```

### Hint UI rules

- If the player is at rank `2`, disable the hint button.
- Tooltip: `You are very close to the answer. Try guessing the final word!`
- Once a hint is used, the card flips to reveal a related word.
- Hints must never reveal the keyword.

---

## 9.6. Leaderboard

```tsx
<div className="game-card-soft p-4">
  <div className="mb-4 flex items-center justify-between">
    <h3 className="font-bold">Leaderboard</h3>
    <Trophy className="size-5 text-rank-exact" />
  </div>

  <div className="space-y-2">{/* Player rows */}</div>
</div>
```

Player row:

```tsx
<div className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2">
  <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
    1
  </div>

  <div className="min-w-0 flex-1">
    <p className="truncate text-sm font-semibold">Giau</p>
    <p className="text-xs text-muted-foreground">Solved · 18 guesses</p>
  </div>

  <div className="font-mono text-sm font-black text-rank-exact">920</div>
</div>
```

### Leaderboard states

| State   | UI                                         |
| ------- | ------------------------------------------ |
| Playing | Show total score + status                  |
| Solved  | `Solved` badge + time + guess count        |
| Gave up | `Gave up` badge, ranked last for the round |
| Waiting | `Waiting` badge                            |
| Admin   | Small crown icon                           |

---

## 9.7. Admin settings screen

Used for configuring the Gemini key.

```tsx
<Card className="game-card mx-auto max-w-xl p-6">
  <CardHeader className="px-0 pt-0">
    <CardTitle>Admin Settings</CardTitle>
    <CardDescription>
      Enter your Gemini API key so the frontend can call it directly when creating a game.
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-4 px-0">
    <Input type="password" placeholder="AIza..." className="h-12 rounded-xl bg-white/[0.06]" />

    <p className="text-xs leading-6 text-muted-foreground">
      For personal / non-public projects only. Do not commit API keys to source code.
    </p>
  </CardContent>
</Card>
```

Rules:

- API key is stored in `localStorage`, not in Firestore.
- Provide a `Test Gemini Key` button.
- Provide a `Clear Key` button.
- Mask the key by default.
- Do not log the key to the console.

---

## 9.8. Admin Create New Game screen

```tsx
<div className="game-card p-6">
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-2xl font-bold">Create New Game</h2>
      <p className="text-sm text-muted-foreground">
        Gemini will generate a keyword and 1000 commonly related Vietnamese words.
      </p>
    </div>

    <Button className="rounded-xl bg-primary font-semibold">
      <WandSparkles className="mr-2 size-4" />
      Generate with Gemini
    </Button>
  </div>
</div>
```

Generation states:

| State      | UI                                                |
| ---------- | ------------------------------------------------- |
| Idle       | Normal button                                     |
| Generating | Loading button + progress text                    |
| Validating | Show checklist                                    |
| Preview    | Show keyword hidden/masked + sample related words |
| Saving     | Disable actions                                   |
| Success    | Toast + redirect to room                          |
| Error      | Destructive alert, allow retry/import JSON        |

---

## 10. Animation Guidelines

### 10.1. Framer Motion defaults

```ts
export const motionConfig = {
  transition: {
    type: "spring",
    stiffness: 280,
    damping: 24,
    mass: 0.7,
  },
};

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

export const listItem = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 12 },
};
```

### 10.2. Animation rules

| Interaction             | Motion                                    |
| ----------------------- | ----------------------------------------- |
| Join room               | Fade + scale in                           |
| Submit guess            | Micro shake on input if invalid           |
| New result row          | Slide up + fade                           |
| Better guess            | Glow pulse                                |
| Rank <= 20              | Flame/spark icon light bounce             |
| Correct answer          | Card glow + confetti + leaderboard update |
| Hint reveal             | Flip card                                 |
| Round transition        | Fade out old round, scale in new round    |
| Leaderboard rank change | Layout animation                          |

### 10.3. What NOT to animate

- Do not animate the entire screen continuously.
- Do not use overly strong bounce for primary UI elements.
- Do not trigger confetti on every good rank; only use it on a correct answer or end game.
- Do not let animations exceed 500ms for routine interactions.

---

## 11. Icon System

Use `lucide-react`.

### 11.1. Icon mapping

| Feature        | Icon                             |
| -------------- | -------------------------------- |
| Game / round   | `Brain`, `Puzzle`, `Target`      |
| Room           | `DoorOpen`, `UsersRound`         |
| Submit guess   | `Send`, `CornerDownLeft`         |
| Hint           | `Sparkles`, `Lightbulb`          |
| Score          | `Coins`, `Gauge`                 |
| Winner         | `Trophy`, `Crown`, `Medal`       |
| Admin          | `Shield`, `Settings`, `KeyRound` |
| Realtime       | `Radio`, `Wifi`                  |
| Time           | `Timer`, `Clock3`                |
| Warning        | `TriangleAlert`                  |
| Give up        | `Flag`                           |
| Create with AI | `WandSparkles`, `Bot`            |

### 11.2. Icon style

- Default size: `size-4` or `size-5`.
- Icon inside a button: `mr-2 size-4`.
- Do not use too many icons in the same row.
- Leaderboard top-3 icons can use semantic colors:
  - Top 1: `text-rank-exact`
  - Top 2: `text-accent`
  - Top 3: `text-primary`

---

## 12. Game State Visual Rules

### 12.1. Room status

| Status       | Label         | Class                                |
| ------------ | ------------- | ------------------------------------ |
| Waiting      | `Waiting`     | `bg-muted text-muted-foreground`     |
| Live         | `Live`        | `bg-success/15 text-success`         |
| Round ending | `Almost done` | `bg-warning/15 text-warning`         |
| Finished     | `Finished`    | `bg-rank-exact/15 text-rank-exact`   |
| Error        | `Error`       | `bg-destructive/15 text-destructive` |

### 12.2. Player status

| Status   | UI                         |
| -------- | -------------------------- |
| Joined   | Muted avatar dot           |
| Guessing | Pulsing primary avatar dot |
| Solved   | Success avatar dot         |
| Gave up  | Destructive avatar dot     |
| Offline  | Avatar at 50% opacity      |

---

## 13. Score UI

### 13.1. Score chip

```tsx
<div className="inline-flex items-center gap-2 rounded-full border border-rank-exact/20 bg-rank-exact/10 px-3 py-1 text-sm font-bold text-rank-exact">
  <Coins className="size-4" />
  <span className="font-mono tabular-nums">920</span>
</div>
```

### 13.2. Score changes

When adding/subtracting points:

```txt
+120
-5 Hint
+30 Close Guess
```

Visual:

- Points added: `text-success`
- Points deducted: `text-warning`
- Large penalty / give up: `text-destructive`
- Floating text disappears after 800ms.

---

## 14. Toast / Feedback

Use shadcn `sonner`.

### 14.1. Toast messages

| Case                    | Message                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| Unknown word            | `This word is not in the related word map.`                       |
| Duplicate guess         | `You have already guessed this word.`                             |
| Hint disabled at rank 2 | `You are very close to the answer. Try guessing the keyword!`     |
| Correct                 | `Correct! You found the keyword.`                                 |
| Give up                 | `You gave up on this round.`                                      |
| Gemini missing key      | `Please enter your Gemini API key in Admin Settings.`             |
| Gemini invalid output   | `Gemini returned data in an unexpected format. Please try again.` |

### 14.2. Tone of voice

Should be friendly, slightly game-like, but not childish.

Good:

```txt
Getting close! You are in the top 100 related words.
```

Avoid:

```txt
Wrong! You are terrible.
```

---

## 15. Page-by-page Design

## 15.1. Landing / Join Room

Goal:

- Player enters their name.
- Clicks to join a room created by the admin.
- No login required.

Layout:

```txt
Hero title
Subtitle
Room ID card
Name input
Join button
Small note
```

Suggested hero:

```txt
Guess the secret word
The closer you get, the warmer the colors. Compete in realtime with your friends.
```

UI class:

```tsx
<div className="game-container flex min-h-screen items-center justify-center">
  <motion.div className="game-card game-glow w-full max-w-xl p-6 sm:p-8">
    <h1 className="text-gradient-brand text-4xl font-black tracking-tight">
      Guess the secret word
    </h1>
  </motion.div>
</div>
```

---

## 15.2. Waiting Room

Goal:

- Show who has joined.
- Admin has a Start Game button.
- Regular players wait.

Elements:

- Large, copyable room code.
- Realtime player list.
- Admin controls.
- Status badge.

Visual:

- Room code uses mono font.
- Small player cards with initial avatars.
- Background can have very subtle motion particles if desired.

---

## 15.3. Game Round

Goal:

- Enter words quickly.
- View guess history.
- View best rank.
- View remaining hints.
- No distractions.

Priority order:

1. Round status
2. Guess input
3. Best guess
4. Hint cards
5. Guess history
6. Leaderboard

---

## 15.4. Round Result

Shown when all players have solved or given up.

Elements:

- Keyword reveal.
- Round leaderboard.
- Each player's best guess.
- Time + guess count.
- Admin `Next Round` button.

Visual:

- Keyword reveal uses `text-gradient-brand`.
- Top 3 use medal/crown icons.
- Players who gave up are listed last with reduced opacity.

---

## 15.5. Final Result

Shown when the admin ends the game.

Elements:

- Champion card.
- Overall leaderboard.
- Stats:
  - Total rounds
  - Fastest solver
  - Fewest guesses
  - Fewest hints used
  - Most close guesses

Visual:

- Champion card is the most prominent element.
- Confetti runs only once.
- Button to copy/share results.

---

## 15.6. Admin Settings

Elements:

- Gemini key input.
- Test key.
- Clear key.
- Model selection if needed:
  - `gemini-2.5-flash`
  - `gemini-2.5-pro` for higher quality
- Security warning.

Visual:

- Do not make the warning overly alarming.
- Use a warning-color alert, not destructive.

---

## 16. Accessibility

### 16.1. Contrast

- Primary text must have sufficient contrast against the dark background.
- Do not rely on color alone to convey rank; include both the `#rank` number and a label.
- Badges must have text, not just an icon.

### 16.2. Keyboard

- Press Enter to submit a guess.
- Tab focus must be clearly visible on inputs, buttons, and hint cards.
- Escape closes modals.
- Dangerous admin actions require a confirmation dialog.

### 16.3. Motion reduction

If the user enables reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.001ms !important;
  }
}
```

---

## 17. Component Naming Convention

### 17.1. Suggested folders

```txt
src/
  components/
    ui/                  # shadcn components
    layout/
      app-shell.tsx
      game-container.tsx
    game/
      guess-input.tsx
      guess-result-row.tsx
      guess-history.tsx
      hint-card.tsx
      leaderboard.tsx
      player-status-list.tsx
      score-chip.tsx
      room-code-card.tsx
      round-status-card.tsx
    admin/
      admin-settings-card.tsx
      create-game-card.tsx
      gemini-output-preview.tsx
```

### 17.2. Class naming

Prefer direct utility classes. Only create custom utilities when a class combination repeats frequently:

- `game-card`
- `game-card-soft`
- `game-container`
- `game-glow`
- `text-gradient-brand`
- `rank-*`

---

## 18. Example Component Patterns

## 18.1. Rank class helper

```ts
export function getRankClass(rank?: number | null) {
  if (!rank) return "rank-unknown";

  if (rank === 1) return "rank-exact";
  if (rank <= 5) return "rank-ultra";
  if (rank <= 20) return "rank-hot";
  if (rank <= 100) return "rank-warm";
  if (rank <= 300) return "rank-close";
  if (rank <= 700) return "rank-cool";
  if (rank <= 1000) return "rank-far";
  // rank > 1000: not in the ranked word list
  return "rank-unknown";
}
```

## 18.2. Rank label helper

```ts
export function getRankLabel(rank?: number | null) {
  if (!rank) return "Not in the word map";
  if (rank === 1) return "Correct";
  if (rank <= 5) return "Extremely close";
  if (rank <= 20) return "Very hot";
  if (rank <= 100) return "Related";
  if (rank <= 300) return "Somewhat close";
  if (rank <= 700) return "Moderately far";
  return "Very far";
}
```

## 18.3. Motion wrapper

```tsx
import { motion } from "framer-motion";

export function MotionCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="game-card"
    >
      {children}
    </motion.div>
  );
}
```

---

## 19. Design QA Checklist

Before merging UI, verify:

- [ ] No random hex colors in components.
- [ ] Primary / secondary / danger buttons are visually distinct.
- [ ] Guess result rows change color correctly based on rank.
- [ ] Mobile playable one-handed.
- [ ] Input is always easy to see and focus.
- [ ] Leaderboard realtime updates without layout jank.
- [ ] Hint correctly disabled when rank = 2.
- [ ] Other players' guesses are not revealed.
- [ ] Dangerous admin actions have a confirmation dialog.
- [ ] Dark theme has no low-contrast text.
- [ ] Animations are minimal and do not cause slowdown.
- [ ] Toast messages are friendly.
- [ ] Font renders Vietnamese characters correctly.
- [ ] Loading state is clear while Gemini is generating.
- [ ] API key is not logged to the console.

---

## 20. Prompt for AI Coding Assistant when implementing UI

Use this prompt when you want an AI to code according to the design system:

```txt
Use DESIGN.md as the strict UI design contract.

Build UI with:
- React + TypeScript
- TailwindCSS
- shadcn/ui
- lucide-react icons
- framer-motion for lightweight transitions

Rules:
- Use semantic tokens like bg-background, text-foreground, bg-primary, text-muted-foreground.
- Do not hard-code random hex colors in components.
- Use game-card, game-card-soft, game-container, game-glow, text-gradient-brand utilities when appropriate.
- Keep the UI dark, modern, premium, and playful but not flashy.
- Guess result rows must use rank classes: rank-exact, rank-ultra, rank-hot, rank-warm, rank-close, rank-cool, rank-far, rank-unknown.
- Add responsive layouts for mobile and desktop.
- Add motion only for meaningful transitions: page enter, guess reveal, hint flip, leaderboard update, victory.
- Do not reveal other players' guesses.
- Admin-only UI must look slightly more technical but still match the game theme.
```

---

## 21. Recommended shadcn Components

Install/use these first:

```txt
button
input
card
badge
dialog
alert-dialog
tabs
tooltip
sonner
separator
avatar
progress
skeleton
dropdown-menu
```

Suggested command:

```bash
npx shadcn@latest add button input card badge dialog alert-dialog tabs tooltip sonner separator avatar progress skeleton dropdown-menu
```

---

## 22. Final UI Quality Target

The UI meets the bar when players feel:

```txt
"Dark, beautiful, smooth, easy to play, competitive, but not visually overwhelming."
```

The admin feels:

```txt
"Easy to create a game, easy to manage the room, easy to handle Gemini errors, no complex backend needed."
```

The developer feels:

```txt
"Tokens are clear, components are clear, easy to maintain, AI can continue coding while keeping the style consistent."
```

---

## 23. Luxury Enhancement Layer (added)

New tokens / utilities in `src/index.css`. Use these for the "modern luxury game" feel.

### 23.1. Display font

- Token: `--font-display` → **Unbounded** (full Vietnamese subset), falls back to Be Vietnam Pro.
- Utility: `font-display`. Use for hero titles, keyword reveal, big scores, podium numbers, panel headers — NOT body text.

### 23.2. Animated background

- `body::before` renders a slow drifting **aurora** (violet / cyan / magenta blobs, 26s). Fixed, behind content, auto-disabled under `prefers-reduced-motion`. No per-component work needed.

### 23.3. Premium effect utilities

| Class               | Effect                                            | Use on                                         |
| ------------------- | ------------------------------------------------- | ---------------------------------------------- |
| `iridescent-border` | Gradient (primary→accent→exact) hairline border   | Hero/join card, keyword reveal, win overlay    |
| `shimmer-overlay`   | Sheen sweep (needs relative/overflow-hidden host) | Top-1 leaderboard row, winner podium step      |
| `glow-pulse-once`   | One-shot ring pulse                               | Guess row that becomes the new best rank       |

### 23.4. Medal / podium colors (DRY)

Top-3 styling lives in `src/lib/utils/leaderboard-medal-style.ts` (`MEDAL_STYLES`), using tokens per §11.2: rank1 `rank-exact`, rank2 `accent`, rank3 `primary`. **Never** hard-code `yellow-400` / `slate-300` / `amber-600` for ranks — import `MEDAL_STYLES`.

### 23.5. Guess heat feedback

- Guess input border/ring **warms toward the best-rank tier** (`TIER_RING` in `guess-input-form.tsx`).
- Guess rows with rank ≤ 20 show a `Flame` icon (lucide); the current best row pulses once.
- Emoji are never used as icons — `Flag`, `PartyPopper`, `Flame` (lucide) replace prior `🏳`/`🎉`.

### 23.6. Active theme: Neon Cyber Arena

The live palette is **Neon Cyber Arena** (set via token *values* in `:root`, so all components inherit):

- Background: OLED near-black, faint blue cast. Primary = **neon cyan**, accent = **magenta**.
- Rank ramp is neon: exact = matrix-green, ultra = cyan, hot = magenta, warm = electric-blue, far/unknown = dim blue/gray.
- Global ambient: cyan/magenta aurora (`body::before`) + faint CRT **scanlines** (`body::after`, overlay blend, low opacity for readability).
- Confetti uses the neon palette (`solved-confetti-burst-effect.ts`).

Cyber utilities (use as accents, not large fills — keep text contrast ≥4.5:1):

| Class         | Effect                                  | Use on                                  |
| ------------- | --------------------------------------- | --------------------------------------- |
| `neon-text`   | Cyan/colored text glow (text-shadow)    | HUD timer, keyword reveal, win headings |
| `neon-glow`   | Outline halo + inner glow (box-shadow)  | Guess input, hero/join card             |
| `hud-corners` | Sci-fi corner brackets (::before/after) | Header bar, side panels, hero card      |

Note: on Cyber surfaces, `iridescent-border` is replaced by `neon-glow` + `hud-corners`. To revert to the prior **Midnight Aurora Glass** look, restore the original `:root` token values (§4) — utilities in §23.1–23.5 stay valid for either theme.
