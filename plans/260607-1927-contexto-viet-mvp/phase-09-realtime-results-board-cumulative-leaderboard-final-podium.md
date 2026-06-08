# Phase 09 — Realtime Results Board, Cumulative Leaderboard & Final Podium

**Status:** ⬜ Todo  
**Priority:** High  
**Effort:** M (2–3h)  
**Requires:** Phase 08

---

## Overview

Realtime board showing who solved/surrendered during active round. Cumulative leaderboard across all rounds. Final podium when admin ends room.

---

## Files to create

### `src/features/results/public-board/realtime-round-results-board.tsx`

Shows during active gameplay — updates realtime as players finish.

```
Panel (side or bottom depending on viewport):
  "Kết quả round #N"
  ─────────────────
  [Medal] Name     Solved in Xm Ys  Rank #N  Score +NNN
  [Medal] Name     Bỏ cuộc          Rank #N  Score +NNN
  ...
  "Đang chờ: N người"  (still playing)
```

Data source: `subscribeToPublicResults()` from Phase 08.

Sort order:
1. `solved` before `surrendered`
2. Among solved: by `finishOrder` ascending (fastest first)
3. Among surrendered: by `bestRank` ascending (closest first)

Each row:
- `solved` → `text-success` + trophy/check icon
- `surrendered` → `text-muted-foreground` + white flag icon
- Animate in with `motion` slide from right on appear (`AnimatePresence`)

---

### `src/features/results/leaderboard/cumulative-leaderboard-panel.tsx`

Shows `players` collection `totalScore` — updates realtime as scores accumulate.

```
Panel / Sheet (admin can toggle):
  "Bảng điểm tổng"
  ─────────────────
  #1  [Name]  NNN điểm  ████████████
  #2  [Name]  NNN điểm  ████████
  #3  [Name]  NNN điểm  ████████
  ...
```

Data source: `subscribeToPlayers()` from Phase 04, sorted by `totalScore` desc.

Score bar: `motion` width animation on score change.

```tsx
<motion.div
  className="h-2 rounded-full bg-primary"
  animate={{ width: `${(score / maxScore) * 100}%` }}
  transition={{ duration: 0.6, ease: 'easeOut' }}
/>
```

---

### `src/features/results/leaderboard/final-podium-page.tsx`

Shown when room status = `ended`.

```
Full screen:
  "🏆 Kết thúc!"
  ─────────────────────────────────
        [2nd]   [1st]   [3rd]
        Name    Name    Name
        NNN     NNN     NNN

  Full leaderboard table below:
  #4 Name  NNN điểm
  #5 Name  NNN điểm
  ...

  [Play Again / New Room] button (admin only)
```

Animations (Motion):
- Podium blocks rise from bottom (`y: 100 → 0`) sequentially
- Names fade in after podium renders
- Score count-up effect
- Gold/silver/bronze medal icons with glow

```tsx
// Podium animation sequence
const podiumOrder = [2, 1, 3] // render 2nd first, then 1st, then 3rd
podiumOrder.forEach((pos, i) => (
  <motion.div
    key={pos}
    initial={{ y: 80, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: i * 0.3, type: 'spring', stiffness: 200 }}
    className={cn('flex flex-col items-center', pos === 1 && 'scale-110')}
  />
))
```

---

### `src/hooks/use-room-listener.ts`

```ts
import { subscribeToRoom } from '@/lib/firestore/room-firestore-repository'
import { useEffect, useState } from 'react'
import type { Room } from '@/types/game.types'

export function useRoomListener(roomId: string) {
  const [room, setRoom] = useState<Room | null>(null)
  useEffect(() => {
    if (!roomId) return
    return subscribeToRoom(roomId, setRoom)
  }, [roomId])
  return room
}
```

---

### `src/hooks/use-players-listener.ts`

```ts
import { subscribeToPlayers } from '@/lib/firestore/room-firestore-repository'
import { useEffect, useState } from 'react'
import type { Player } from '@/types/game.types'

export function usePlayersListener(roomId: string) {
  const [players, setPlayers] = useState<Player[]>([])
  useEffect(() => {
    if (!roomId) return
    return subscribeToPlayers(roomId, setPlayers)
  }, [roomId])
  return players
}
```

---

### `src/hooks/use-public-results-realtime.ts`

```ts
import { subscribeToPublicResults } from './use-public-results-listener'
import { useEffect, useState } from 'react'
import type { PublicRoundResult } from '@/types/game.types'

export function usePublicResultsRealtime(roomId: string, roundId: string) {
  const [results, setResults] = useState<PublicRoundResult[]>([])
  useEffect(() => {
    if (!roomId || !roundId) return
    return subscribeToPublicResults(roomId, roundId, setResults)
  }, [roomId, roundId])
  return results
}
```

---

### `src/features/gameplay/round/game-page-layout.tsx`

Assembles all gameplay components into the `/room/:roomId` page:

```
GamePageLayout
  ├── RoundHeaderStatusBar       (top)
  ├── GuessInputForm             (center-top)
  ├── GuessHistoryList           (center, scrollable)
  ├── HintPanel                  (center-bottom)
  ├── RealtimeRoundResultsBoard  (side panel, slide-in)
  └── AdminRoundControlBar       (admin only, bottom)
```

Navigation logic (in parent):
- Listen room status
- `lobby` → redirect to lobby page
- `active` → show game layout
- `ended` → redirect to final podium

---

## Todo checklist

- [ ] Create `src/features/results/public-board/realtime-round-results-board.tsx`
- [ ] Create `src/features/results/leaderboard/cumulative-leaderboard-panel.tsx`
- [ ] Create `src/features/results/leaderboard/final-podium-page.tsx`
- [ ] Create `src/hooks/use-room-listener.ts`
- [ ] Create `src/hooks/use-players-listener.ts`
- [ ] Create `src/hooks/use-public-results-realtime.ts`
- [ ] Create `src/features/gameplay/round/game-page-layout.tsx`
- [ ] Wire room status → page navigation (lobby / game / ended)
- [ ] Wire `/ended` or modal for final podium when room.status = `ended`
- [ ] Test: two browsers — player A solves → appears in results board of player B within 1s
- [ ] Test: totalScore updates in leaderboard panel after round ends
- [ ] Test: final podium renders top 3 with correct scores
- [ ] Test: podium animations play in sequence (2nd → 1st → 3rd)

---

## Success criteria

- Results board updates < 1s after solve/surrender in other browser
- Leaderboard sorted correctly by totalScore desc
- Final podium: 1st place center + taller, 2nd left, 3rd right
- Podium rise animation triggers sequentially
- Score bar widths animate smoothly on update
