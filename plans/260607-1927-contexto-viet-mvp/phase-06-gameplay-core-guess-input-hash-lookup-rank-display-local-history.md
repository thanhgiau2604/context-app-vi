# Phase 06 — Gameplay Core: Guess Input, Hash Lookup, Rank Display & Local Guess History

**Status:** ⬜ Todo  
**Priority:** Critical  
**Effort:** L (4–5h)  
**Requires:** Phase 04, 05

---

## Overview

The main gameplay loop: player types a word → normalize → hash → Firestore `getDoc(termIndex/{hash})` → get rank → display colored result → update local history + Zustand state.

---

## Rank color mapping

From `DESIGN.md` and `src/index.css` (tokens already defined):

```ts
// src/lib/utils/rank-color-classifier.ts
export type RankTier =
  | 'exact'   // rank 1
  | 'ultra'   // rank 2–10
  | 'hot'     // rank 11–50
  | 'warm'    // rank 51–100
  | 'close'   // rank 101–300
  | 'cool'    // rank 301–600
  | 'far'     // rank 601–1000
  | 'unknown' // not in index

export function getRankTier(rank: number | null): RankTier {
  if (rank === null) return 'unknown'
  if (rank === 1) return 'exact'
  if (rank <= 10) return 'ultra'
  if (rank <= 50) return 'hot'
  if (rank <= 100) return 'warm'
  if (rank <= 300) return 'close'
  if (rank <= 600) return 'cool'
  return 'far'
}

// Maps tier to Tailwind color class using CSS token vars from index.css
export const rankTierColorClass: Record<RankTier, string> = {
  exact:   'text-rank-exact bg-rank-exact/15 border-rank-exact/40',
  ultra:   'text-rank-ultra bg-rank-ultra/15 border-rank-ultra/40',
  hot:     'text-rank-hot bg-rank-hot/15 border-rank-hot/40',
  warm:    'text-rank-warm bg-rank-warm/15 border-rank-warm/40',
  close:   'text-rank-close bg-rank-close/15 border-rank-close/40',
  cool:    'text-rank-cool bg-rank-cool/15 border-rank-cool/40',
  far:     'text-rank-far bg-rank-far/15 border-rank-far/40',
  unknown: 'text-muted-foreground bg-muted/30 border-muted/30',
}
```

---

## Files to create

### `src/lib/firestore/term-index-lookup-service.ts`

```ts
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import type { TermIndexDoc } from '@/types/game.types'

export async function lookupTermHash(
  roomId: string,
  roundId: string,
  hash: string
): Promise<TermIndexDoc | null> {
  const snap = await getDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'termIndex', hash))
  return snap.exists() ? (snap.data() as TermIndexDoc) : null
}
```

---

### `src/lib/utils/rank-color-classifier.ts`

Full implementation as shown above.

---

### `src/features/gameplay/guess/guess-submission-service.ts`

```ts
import { normalizeVietnamese } from '@/lib/utils/normalize-vi'
import { hashTerm } from '@/lib/utils/term-hash'
import { lookupTermHash } from '@/lib/firestore/term-index-lookup-service'
import type { LocalGuess } from '@/types/game.types'

type GuessResult = {
  rank: number | null
  type: 'keyword' | 'related' | null
  notFound: boolean
}

export async function submitGuess(
  input: string,
  roundSalt: string,
  roomId: string,
  roundId: string
): Promise<GuessResult & { localGuess: LocalGuess }> {
  const normalized = normalizeVietnamese(input)
  if (!normalized) return { rank: null, type: null, notFound: false, localGuess: { text: input, normalizedText: normalized, rank: null, createdAt: Date.now() } }

  const hash = await hashTerm(roundSalt, normalized)
  const result = await lookupTermHash(roomId, roundId, hash)

  const localGuess: LocalGuess = {
    text: input,
    normalizedText: normalized,
    rank: result?.rank ?? null,
    createdAt: Date.now(),
  }

  return {
    rank: result?.rank ?? null,
    type: result?.type ?? null,
    notFound: result === null,
    localGuess,
  }
}
```

---

### `src/features/gameplay/guess/guess-input-form.tsx`

```
<form onSubmit={handleGuess}>
  <Input
    placeholder="Nhập từ đoán..."
    value={input}
    onChange={...}
    disabled={isLoading || playerStatus !== 'playing'}
    autoFocus
    autoComplete="off"
  />
  <Button type="submit" disabled={isLoading || !input.trim()}>
    {isLoading ? <Spinner /> : <ArrowRight />}
  </Button>
</form>
```

On submit:
1. Call `submitGuess()`
2. If `notFound` → shake animation + toast "Từ này chưa có trong dữ liệu round"
3. If `rank === 1` → trigger solved flow (Phase 08)
4. If `rank !== null` → `addLocalGuess()` + `updateBestRank(rank)`
5. Clear input

Animation: `motion` shake on notFound.

---

### `src/features/gameplay/guess/guess-history-list.tsx`

Displays local guess history sorted by rank ascending.

```
[RankBadge] [term text]  [rank number]
```

Each row:
- Background/text color from `rankTierColorClass[getRankTier(rank)]`
- Slide-in animation on appear (Motion `AnimatePresence` + `initial/animate/exit`)
- Sort: best rank first (ascending), unranked last

```tsx
// Each item
<motion.div
  key={guess.createdAt}
  initial={{ opacity: 0, y: -8 }}
  animate={{ opacity: 1, y: 0 }}
  className={cn('flex items-center gap-3 px-4 py-2 rounded-lg border', rankTierColorClass[tier])}
>
  <RankBadge rank={guess.rank} />
  <span className="flex-1 font-medium">{guess.text}</span>
</motion.div>
```

---

### `src/features/gameplay/round/round-header-status-bar.tsx`

```
[Round #N]  [bestRank badge]  [guessCount]  [Timer]  [Hint button]  [Surrender button]
```

- bestRank badge changes color by tier
- Timer: counts up from round start
- Hint button: disabled when `usedHints >= 3` or `bestRank <= 2` or `bestRank === null`
- Surrender: always visible when `status === 'playing'`

---

### `src/hooks/use-round-salt.ts`

```ts
// Reads roundSalt from Firestore round doc (needed for hashing)
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function getRoundSalt(roomId: string, roundId: string): Promise<string> {
  const snap = await getDoc(doc(db, 'rooms', roomId, 'rounds', roundId))
  if (!snap.exists()) throw new Error('Round not found')
  return snap.data().roundSalt as string
}
```

---

## Todo checklist

- [ ] Create `src/lib/utils/rank-color-classifier.ts`
- [ ] Create `src/lib/firestore/term-index-lookup-service.ts`
- [ ] Create `src/features/gameplay/guess/guess-submission-service.ts`
- [ ] Create `src/features/gameplay/guess/guess-input-form.tsx`
- [ ] Create `src/features/gameplay/guess/guess-history-list.tsx`
- [ ] Create `src/features/gameplay/round/round-header-status-bar.tsx`
- [ ] Create `src/hooks/use-round-salt.ts`
- [ ] Assemble into `/room/:roomId` game page
- [ ] Test: type known term → correct rank appears with right color
- [ ] Test: type unknown term → shake animation + toast
- [ ] Test: type keyword → solved flow triggers (stub OK for now)
- [ ] Test: guess history sorted correctly, colors match rank tiers

---

## Success criteria

- Guess input → Firestore lookup roundtrip < 500ms
- Unknown word shows toast, does NOT add to history
- Rank colors match `DESIGN.md` Midnight Arena theme
- Guess history updates instantly without page reload
- `bestRank` in Zustand store always reflects lowest rank seen
