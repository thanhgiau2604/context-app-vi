# Phase 08 — Round Completion: Scoring Formula, Solved Flow, Surrender Flow, Next Round

**Status:** ⬜ Todo  
**Priority:** High  
**Effort:** M (3h)  
**Requires:** Phase 06, 07

---

## Overview

Handle solved (rank = 1), surrender, score calculation, publicResult write, round locking when all players done, admin next round / end room.

---

## Scoring formula (from brainstorm section 9)

```ts
// src/lib/utils/round-score-calculator.ts

function getBaseScore(bestRank: number | null): number {
  if (!bestRank) return 0;
  if (bestRank === 1) return 1000;
  if (bestRank <= 3) return 750;
  if (bestRank <= 10) return 500;
  if (bestRank <= 50) return 250;
  if (bestRank <= 100) return 120;
  if (bestRank <= 300) return 40;
  if (bestRank <= 1000) return 10;
  return 0;
}

function getSpeedBonus(status: "solved" | "surrendered", durationSec: number): number {
  if (status !== "solved") return 0;
  return Math.max(0, 200 - Math.floor(durationSec * 1.5));
}

export function calculateRoundScore(params: {
  status: "solved" | "surrendered";
  bestRank: number | null;
  durationSec: number;
  guessCount: number;
  usedHints: number;
}): number {
  const HINT_PENALTIES = [25, 45, 70];
  const base = getBaseScore(params.bestRank);
  const solvedBonus = params.status === "solved" ? 300 : 0;
  const speedBonus = getSpeedBonus(params.status, params.durationSec);
  const guessPenalty = Math.min(params.guessCount * 3, 120);
  const hintPenalty = Array.from(
    { length: params.usedHints },
    (_, i) => HINT_PENALTIES[i] ?? 0,
  ).reduce((a, b) => a + b, 0);
  const surrenderPenalty = params.status === "surrendered" ? 80 : 0;

  return Math.max(
    0,
    base + solvedBonus + speedBonus - guessPenalty - hintPenalty - surrenderPenalty,
  );
}
```

---

## Files to create

### `src/lib/utils/round-score-calculator.ts`

Full implementation as above.

---

### `src/features/gameplay/round/round-completion-service.ts`

```ts
import { db } from "@/lib/firebase";
import { doc, updateDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";
import { calculateRoundScore } from "@/lib/utils/round-score-calculator";
import type { PublicRoundResult } from "@/types/game.types";

type FinishRoundParams = {
  roomId: string;
  roundId: string;
  uid: string;
  name: string;
  status: "solved" | "surrendered";
  bestRank: number | null;
  guessCount: number;
  usedHints: number;
  hintPenalty: number;
  startedAtMs: number;
  finishOrder: number;
};

export async function finishPlayerRound(params: FinishRoundParams): Promise<number> {
  const durationMs = Date.now() - params.startedAtMs;
  const durationSec = durationMs / 1000;

  const roundScore = calculateRoundScore({
    status: params.status,
    bestRank: params.bestRank,
    durationSec,
    guessCount: params.guessCount,
    usedHints: params.usedHints,
  });

  // Update playerRound
  await updateDoc(
    doc(db, "rooms", params.roomId, "rounds", params.roundId, "playerRounds", params.uid),
    {
      status: params.status,
      finishedAt: serverTimestamp(),
      roundScore,
    },
  );

  // Write publicResult
  const publicResult: Omit<PublicRoundResult, "createdAt"> & { createdAt: unknown } = {
    uid: params.uid,
    name: params.name,
    status: params.status,
    finishOrder: params.finishOrder,
    guessCount: params.guessCount,
    bestRank: params.bestRank,
    durationMs,
    usedHints: params.usedHints,
    roundScore,
    createdAt: serverTimestamp(),
  };
  await setDoc(
    doc(db, "rooms", params.roomId, "rounds", params.roundId, "publicResults", params.uid),
    publicResult,
  );

  // Increment player totalScore
  await updateDoc(doc(db, "rooms", params.roomId, "players", params.uid), {
    totalScore: increment(roundScore),
  });

  return roundScore;
}
```

---

### `src/features/gameplay/round/solved-celebration-overlay.tsx`

Shown when player guesses rank 1:

```
Full-screen overlay (semi-transparent dark)
  - Confetti burst (Motion keyframes or canvas-confetti library)
  - "🎉 Chính xác!" heading
  - Keyword revealed large
  - Score earned this round
  - Dismiss button → overlay fades, game shows leaderboard position
```

Motion: `AnimatePresence` with scale + opacity entry.

---

### `src/features/gameplay/round/surrender-confirmation-dialog.tsx`

```
Dialog: Bỏ cuộc?
  "Bạn sẽ được xem đáp án nhưng xếp cuối bảng round này."
  [Huỷ]  [Bỏ cuộc]
```

On confirm:

1. Call `finishPlayerRound({ status: 'surrendered', ... })`
2. Read `private/secret` → show keyword
3. Show keyword reveal card
4. Lock guess input

---

### `src/features/gameplay/round/keyword-reveal-card.tsx`

Shown after surrender or when round `revealed`:

```
Card with glow border
  "Đáp án là:"
  [keyword large, rank-exact color]
```

---

### `src/hooks/use-public-results-listener.ts`

```ts
// Listen to publicResults realtime — drives round lock check + leaderboard
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import type { PublicRoundResult } from "@/types/game.types";

export function subscribeToPublicResults(
  roomId: string,
  roundId: string,
  callback: (results: PublicRoundResult[]) => void,
) {
  return onSnapshot(collection(db, "rooms", roomId, "rounds", roundId, "publicResults"), (snap) =>
    callback(snap.docs.map((d) => d.data() as PublicRoundResult)),
  );
}
```

---

### `src/features/admin/panel/admin-round-control-bar.tsx`

Admin sees this during gameplay:

```
[Next Round] — disabled until all active players have publicResult
[End Room]   — always available to admin
```

Logic for "all done": compare `publicResults.length` to active player count.  
Client-side check (no backend): admin listens `publicResults` + `players`.

On Next Round:

1. `updateRoundStatus(roomId, roundId, 'completed')`
2. Create new round → `createGame()` flow (open Create Game dialog again)
3. Update `rooms/{roomId}.currentRoundId`

On End Room:

1. `updateRoomStatus(roomId, 'ended')`
2. Navigate to final leaderboard

---

## Todo checklist

- [ ] Create `src/lib/utils/round-score-calculator.ts`
- [ ] Create `src/features/gameplay/round/round-completion-service.ts`
- [ ] Create `src/features/gameplay/round/solved-celebration-overlay.tsx`
- [ ] Create `src/features/gameplay/round/surrender-confirmation-dialog.tsx`
- [ ] Create `src/features/gameplay/round/keyword-reveal-card.tsx`
- [ ] Create `src/hooks/use-public-results-listener.ts`
- [ ] Create `src/features/admin/panel/admin-round-control-bar.tsx`
- [ ] Wire solved flow: rank 1 → `finishPlayerRound(solved)` → confetti overlay
- [ ] Wire surrender flow: confirm → `finishPlayerRound(surrendered)` → show keyword
- [ ] Test: solved score formula correct (base 1000 + 300 bonus - penalties)
- [ ] Test: surrendered score (best rank 50) = 250 - 80 = 170 minimum
- [ ] Test: `publicResult` written to Firestore after solve/surrender
- [ ] Test: `totalScore` increments in players collection
- [ ] Test: Next Round button enables only when all players have publicResult

---

## Success criteria

- Score calculation matches formula for all rank tiers
- publicResult appears in Firestore within 1s of solve/surrender
- Confetti plays on correct solve
- Surrender shows keyword immediately
- Admin Next Round button correctly disabled/enabled
