# Phase 07 — Hint System: Dynamic hintPool Lookup (bestRank - random step 1–5)

**Status:** ⬜ Todo  
**Priority:** High  
**Effort:** M (2h)  
**Requires:** Phase 05, 06

---

## Overview

When player clicks hint: pick `targetRank = max(2, bestRank - random(1..5))` → query `hintPool` for nearest rank ≤ targetRank → reveal term + rank → trừ điểm → increment `usedHints`.

---

## Hint rules recap

| Condition | Result |
|-----------|--------|
| `bestRank === null` | Block — chưa đoán lần nào |
| `bestRank <= 2` | Block — quá gần keyword |
| `usedHints >= 3` | Block — hết lượt hint |
| Round not `playing` | Block |
| Otherwise | Allow |

Penalty: hint 1 → -25, hint 2 → -45, hint 3 → -70

---

## Files to create

### `src/lib/firestore/hint-pool-firestore-lookup-service.ts`

```ts
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import type { HintPoolEntry } from '@/types/game.types'

// Get the hintPool entry with highest rank that is still ≤ targetRank
// hintPool docs are keyed by zero-padded rank string ("0010", "0100", etc.)
export async function getHintForTargetRank(
  roomId: string,
  roundId: string,
  targetRank: number
): Promise<HintPoolEntry | null> {
  const poolRef = collection(db, 'rooms', roomId, 'rounds', roundId, 'hintPool')
  // Query: rank <= targetRank, order by rank desc, take 1
  const q = query(
    poolRef,
    where('rank', '<=', targetRank),
    orderBy('rank', 'desc'),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data() as HintPoolEntry
}
```

---

### `src/features/gameplay/hint/hint-logic-service.ts`

```ts
import { getHintForTargetRank } from '@/lib/firestore/hint-pool-firestore-lookup-service'

const HINT_PENALTIES = [25, 45, 70] // index 0,1,2 = hint 1,2,3

export type HintResult = {
  term: string
  rank: number
  penalty: number
  hintIndex: number // 1, 2, or 3
}

export type HintBlockReason =
  | 'not-guessed-yet'
  | 'too-close'
  | 'no-hints-left'
  | 'round-not-playing'

export function getHintBlockReason(
  bestRank: number | null,
  usedHints: number,
  roundStatus: string
): HintBlockReason | null {
  if (roundStatus !== 'playing') return 'round-not-playing'
  if (bestRank === null) return 'not-guessed-yet'
  if (bestRank <= 2) return 'too-close'
  if (usedHints >= 3) return 'no-hints-left'
  return null
}

export function getHintBlockMessage(reason: HintBlockReason): string {
  switch (reason) {
    case 'not-guessed-yet': return 'Hãy đoán ít nhất một từ trước khi dùng gợi ý.'
    case 'too-close': return 'Bạn đã rất gần đáp án. Không thể mở thêm gợi ý — hãy đoán keyword cuối cùng!'
    case 'no-hints-left': return 'Bạn đã dùng hết 3 lượt gợi ý.'
    case 'round-not-playing': return 'Round chưa bắt đầu hoặc đã kết thúc.'
  }
}

export async function resolveHint(
  roomId: string,
  roundId: string,
  bestRank: number,
  usedHints: number
): Promise<HintResult | null> {
  // Random step 1–5, capped so hint rank >= 2
  const maxStep = Math.min(5, bestRank - 2) // bestRank > 2 guaranteed by caller
  if (maxStep < 1) return null

  const step = Math.floor(Math.random() * maxStep) + 1
  const targetRank = bestRank - step

  const entry = await getHintForTargetRank(roomId, roundId, targetRank)
  if (!entry) return null

  const hintIndex = usedHints + 1 // 1-based
  return {
    term: entry.term,
    rank: entry.rank,
    penalty: HINT_PENALTIES[usedHints],
    hintIndex,
  }
}
```

---

### `src/features/gameplay/hint/hint-panel.tsx`

```
HintPanel
  ├─ 3 HintSlot cards (locked / revealed)
  │    Each slot: index label, lock icon or revealed term+rank
  ├─ [Gợi ý] button
  │    - Disabled with tooltip when block reason exists
  │    - Loading spinner when fetching
  └─ Penalty label: "-25 / -45 / -70 điểm"
```

On hint button click:
1. Check `getHintBlockReason()` → if not null, show toast with message, return
2. Call `resolveHint()`
3. If null result → toast "Không tìm được gợi ý phù hợp"
4. If success:
   - Flip card animation (Motion `rotateY`)
   - Show term + rank with tier color
   - `incrementUsedHints()` in Zustand
   - Write hint penalty to `playerRounds/{uid}.hintPenalty` in Firestore
   - Write updated `usedHints` to `playerRounds/{uid}.usedHints`

```tsx
// HintSlot
<motion.div
  animate={revealed ? { rotateY: 0 } : { rotateY: 0 }}
  className={cn('rounded-xl border p-4', revealed ? rankTierColorClass[tier] : 'bg-game-surface-2')}
>
  {revealed ? (
    <>
      <span className="font-bold">{term}</span>
      <RankBadge rank={rank} />
    </>
  ) : (
    <LockIcon className="text-muted-foreground" />
  )}
</motion.div>
```

---

### `src/lib/firestore/player-round-firestore-service.ts`

```ts
import { db } from '@/lib/firebase'
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import type { PlayerRound } from '@/types/game.types'

export async function initPlayerRound(roomId: string, roundId: string, uid: string) {
  await setDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'playerRounds', uid), {
    uid,
    status: 'playing',
    startedAt: serverTimestamp(),
    guessCount: 0,
    bestRank: null,
    usedHints: 0,
    hintPenalty: 0,
    roundScore: 0,
  } satisfies Omit<PlayerRound, 'startedAt'> & { startedAt: unknown })
}

export async function updatePlayerRoundAfterGuess(
  roomId: string, roundId: string, uid: string,
  update: { guessCount: number; bestRank: number | null }
) {
  await updateDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'playerRounds', uid), update)
}

export async function updatePlayerRoundAfterHint(
  roomId: string, roundId: string, uid: string,
  update: { usedHints: number; hintPenalty: number }
) {
  await updateDoc(doc(db, 'rooms', roomId, 'rounds', roundId, 'playerRounds', uid), update)
}
```

---

## Todo checklist

- [ ] Create `src/lib/firestore/hint-pool-firestore-lookup-service.ts`
- [ ] Create `src/features/gameplay/hint/hint-logic-service.ts`
- [ ] Create `src/features/gameplay/hint/hint-panel.tsx`
- [ ] Create `src/lib/firestore/player-round-firestore-service.ts`
- [ ] Integrate HintPanel into game page layout
- [ ] Test: `bestRank = null` → block with toast
- [ ] Test: `bestRank = 2` → block with "quá gần" message
- [ ] Test: `usedHints = 3` → button disabled
- [ ] Test: valid hint → hintPool lookup returns term with rank ≤ bestRank - 1
- [ ] Test: revealed hint has correct tier color
- [ ] Test: flip card animation plays on reveal

---

## Success criteria

- Hint blocked correctly in all 4 block conditions
- Revealed term always has rank strictly less than bestRank
- Term text visible after flip animation
- `usedHints` increments in Zustand + Firestore
- hintPenalty accumulates correctly across 3 hints
