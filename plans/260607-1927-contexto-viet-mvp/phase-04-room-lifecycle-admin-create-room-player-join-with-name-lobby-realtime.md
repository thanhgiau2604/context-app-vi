# Phase 04 — Room Lifecycle: Admin Create Room, Player Join with Name, Lobby Realtime

**Status:** ⬜ Todo  
**Priority:** High  
**Effort:** M (2–3h)  
**Requires:** Phase 02

---

## Overview

Admin creates room → gets room link → players open link, enter name, join lobby → realtime player list.

---

## Firestore paths

```
rooms/{roomId}                          Room doc
rooms/{roomId}/players/{uid}            Player doc
```

---

## Files to create

### `src/lib/firestore/room-firestore-repository.ts`

```ts
import { db } from '@/lib/firebase'
import {
  doc, setDoc, updateDoc, getDoc, onSnapshot,
  collection, serverTimestamp, Timestamp
} from 'firebase/firestore'
import type { Room, Player } from '@/types/game.types'
import { nanoid } from 'nanoid'

export async function createRoom(adminUid: string): Promise<string> {
  const roomId = nanoid(8).toUpperCase()
  const roomRef = doc(db, 'rooms', roomId)
  await setDoc(roomRef, {
    roomId,
    adminUid,
    status: 'lobby',
    playerCount: 0,
    createdAt: serverTimestamp(),
  } satisfies Omit<Room, 'createdAt'> & { createdAt: unknown })
  return roomId
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, 'rooms', roomId))
  return snap.exists() ? (snap.data() as Room) : null
}

export async function updateRoomStatus(roomId: string, status: Room['status']) {
  await updateDoc(doc(db, 'rooms', roomId), { status })
}

export function subscribeToRoom(roomId: string, callback: (room: Room | null) => void) {
  return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
    callback(snap.exists() ? (snap.data() as Room) : null)
  })
}

export function subscribeToPlayers(roomId: string, callback: (players: Player[]) => void) {
  return onSnapshot(collection(db, 'rooms', roomId, 'players'), (snap) => {
    callback(snap.docs.map((d) => d.data() as Player))
  })
}
```

---

### `src/lib/firestore/player-firestore-repository.ts`

```ts
import { db } from '@/lib/firebase'
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import type { Player } from '@/types/game.types'

export async function joinRoom(roomId: string, uid: string, name: string): Promise<void> {
  await setDoc(doc(db, 'rooms', roomId, 'players', uid), {
    uid,
    name,
    joinedAt: serverTimestamp(),
    isActive: true,
    totalScore: 0,
    lastSeenAt: serverTimestamp(),
  } satisfies Omit<Player, 'joinedAt' | 'lastSeenAt'> & { joinedAt: unknown; lastSeenAt: unknown })
}

export async function updatePlayerScore(roomId: string, uid: string, totalScore: number) {
  await updateDoc(doc(db, 'rooms', roomId, 'players', uid), {
    totalScore,
    lastSeenAt: serverTimestamp(),
  })
}
```

---

### `src/features/room/join/player-join-room-page.tsx`

Flow:
1. Read `roomId` from URL params
2. Call `ensureAnonymousUser()` on mount
3. Check room exists + status is `lobby` or `active`
4. Show name input form
5. On submit: `joinRoom(roomId, uid, name)` → `setPlayer(uid, name)` → navigate to `/room/:roomId`

UI:
```
Centered card
  - Game logo / title
  - "Nhập tên của bạn"
  - Input: name (max 20 chars)
  - Button: Tham gia
  - Room code badge
```

---

### `src/features/room/lobby/room-lobby-page.tsx`

Shown after join, before admin starts game.

```
Header: Room code [roomId]  |  Share link button
Player list (realtime):
  - Avatar letter + name
  - "Đang chờ..." indicator
  - Player count badge
Admin sees:
  - [Start Game] button (disabled until ≥ 1 player)
  - Room link copy button
Player sees:
  - "Chờ admin bắt đầu..."
```

Hooks:
- `subscribeToRoom(roomId, ...)` — watch room status, navigate when `active`
- `subscribeToPlayers(roomId, ...)` — realtime player list

---

### `src/features/admin/panel/admin-panel-page.tsx`

```
Admin Dashboard
  ├─ [Create New Room] button → calls createRoom(), navigate to /room/:roomId
  ├─ Link to /admin/settings
  └─ Current room status (if room active)
```

On mount: `ensureAnonymousUser()`, store UID as admin.

---

## Todo checklist

- [ ] Create `src/lib/firestore/room-firestore-repository.ts`
- [ ] Create `src/lib/firestore/player-firestore-repository.ts`
- [ ] Create `src/features/room/join/player-join-room-page.tsx`
- [ ] Create `src/features/room/lobby/room-lobby-page.tsx`
- [ ] Create `src/features/admin/panel/admin-panel-page.tsx`
- [ ] Wire routes: `/` → join page, `/room/:roomId` → lobby/game, `/admin` → admin panel
- [ ] Test: admin creates room → room appears in Firestore
- [ ] Test: player opens room link → enters name → appears in player list realtime
- [ ] Test: two browsers open same room → both see each other in lobby

---

## Success criteria

- Room created with 8-char uppercase ID
- Player joins with name, no login required
- Player list updates realtime in both browsers
- Room status listener triggers navigation when admin starts game
