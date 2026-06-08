# Phase 02 — Firestore Types, Schemas, Firebase Init & Anonymous Auth

**Status:** ⬜ Todo  
**Priority:** Critical — all features depend on this  
**Effort:** M (2–3h)  
**Requires:** Phase 01 done

---

## Overview

Define all Firestore document types, Zod schemas, Firebase init, Anonymous Auth utility.

---

## Files to create

### `src/types/game.types.ts`

All Firestore document shapes:

```ts
import { Timestamp } from "firebase/firestore";

export type RoomStatus = "created" | "lobby" | "active" | "ended";
export type RoundStatus = "draft" | "ready" | "playing" | "locked" | "revealed" | "completed";
export type PlayerRoundStatus = "playing" | "solved" | "surrendered";

export type Room = {
  roomId: string;
  adminUid: string;
  status: RoomStatus;
  currentRoundId?: string;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  playerCount: number;
};

export type Player = {
  uid: string;
  name: string;
  joinedAt: Timestamp;
  isActive: boolean;
  totalScore: number;
  lastSeenAt: Timestamp;
};

export type Round = {
  roundId: string;
  status: RoundStatus;
  roundNumber: number;
  roundSalt: string;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
  termCount: number;
  createdBy: string;
};

export type TermIndexDoc = {
  rank: number;
  type: "keyword" | "related";
};

// Path: rooms/{roomId}/rounds/{roundId}/hintPool/{rank}
export type HintPoolEntry = {
  rank: number;
  term: string;
};

// Path: rooms/{roomId}/rounds/{roundId}/private/secret
export type RoundSecret = {
  keyword: string;
  normalizedKeyword: string;
};

export type PlayerRound = {
  uid: string;
  status: PlayerRoundStatus;
  startedAt: Timestamp;
  finishedAt?: Timestamp;
  guessCount: number;
  bestRank: number | null;
  usedHints: number;
  hintPenalty: number;
  roundScore: number;
};

export type PublicRoundResult = {
  uid: string;
  name: string;
  status: "solved" | "surrendered";
  finishOrder: number;
  guessCount: number;
  bestRank: number | null;
  durationMs: number;
  usedHints: number;
  roundScore: number;
  createdAt: Timestamp;
};

// Client-only (Zustand, not Firestore)
export type LocalGuess = {
  text: string;
  normalizedText: string;
  rank: number | null;
  createdAt: number;
};
```

---

### `src/lib/firebase.ts`

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

---

### `src/lib/firebase-anonymous-auth.ts`

```ts
import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./firebase";

export async function ensureAnonymousUser(): Promise<User> {
  if (auth.currentUser) return auth.currentUser;
  const result = await signInAnonymously(auth);
  return result.user;
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
```

---

### `src/stores/game-store.ts`

```ts
import { create } from "zustand";
import type { LocalGuess } from "@/types/game.types";

type GameStore = {
  roomId: string | null;
  uid: string | null;
  playerName: string | null;
  isAdmin: boolean;
  currentRoundId: string | null;
  localGuesses: LocalGuess[];
  bestRank: number | null;
  usedHints: number;
  // actions
  setRoom: (roomId: string) => void;
  setPlayer: (uid: string, name: string, isAdmin?: boolean) => void;
  setRound: (roundId: string) => void;
  addLocalGuess: (guess: LocalGuess) => void;
  updateBestRank: (rank: number) => void;
  incrementUsedHints: () => void;
  resetRoundState: () => void;
  resetAll: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  roomId: null,
  uid: null,
  playerName: null,
  isAdmin: false,
  currentRoundId: null,
  localGuesses: [],
  bestRank: null,
  usedHints: 0,

  setRoom: (roomId) => set({ roomId }),
  setPlayer: (uid, name, isAdmin = false) => set({ uid, playerName: name, isAdmin }),
  setRound: (roundId) => set({ currentRoundId: roundId }),
  addLocalGuess: (guess) => set((s) => ({ localGuesses: [guess, ...s.localGuesses] })),
  updateBestRank: (rank) =>
    set((s) => ({ bestRank: s.bestRank === null || rank < s.bestRank ? rank : s.bestRank })),
  incrementUsedHints: () => set((s) => ({ usedHints: s.usedHints + 1 })),
  resetRoundState: () =>
    set({ localGuesses: [], bestRank: null, usedHints: 0, currentRoundId: null }),
  resetAll: () =>
    set({
      roomId: null,
      uid: null,
      playerName: null,
      isAdmin: false,
      currentRoundId: null,
      localGuesses: [],
      bestRank: null,
      usedHints: 0,
    }),
}));
```

---

### `src/stores/admin-store.ts`

```ts
import { create } from "zustand";

const GEMINI_KEY_STORAGE = "viet-contexto.admin.geminiApiKey";
const GEMINI_MODEL_STORAGE = "viet-contexto.admin.geminiModel";

type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-pro";

type AdminStore = {
  geminiApiKey: string;
  geminiModel: GeminiModel;
  rememberKey: boolean;
  setGeminiApiKey: (key: string, remember: boolean) => void;
  setGeminiModel: (model: GeminiModel) => void;
  clearGeminiKey: () => void;
  loadSavedSettings: () => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  geminiApiKey: "",
  geminiModel: "gemini-2.5-flash",
  rememberKey: false,

  setGeminiApiKey: (key, remember) => {
    if (remember) {
      localStorage.setItem(GEMINI_KEY_STORAGE, key);
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
    set({ geminiApiKey: key, rememberKey: remember });
  },

  setGeminiModel: (model) => {
    localStorage.setItem(GEMINI_MODEL_STORAGE, model);
    set({ geminiModel: model });
  },

  clearGeminiKey: () => {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
    set({ geminiApiKey: "", rememberKey: false });
  },

  loadSavedSettings: () => {
    const key = localStorage.getItem(GEMINI_KEY_STORAGE) ?? "";
    const model = (localStorage.getItem(GEMINI_MODEL_STORAGE) as GeminiModel) ?? "gemini-2.5-flash";
    set({ geminiApiKey: key, geminiModel: model, rememberKey: !!key });
  },
}));
```

---

### `src/lib/utils/normalize-vi.ts`

```ts
// Normalize Vietnamese input for consistent hashing
export function normalizeVietnamese(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:()\[\]{}"']/g, "")
    .replace(/\s+/g, " ");
}
```

---

### `src/lib/utils/term-hash.ts`

```ts
// SHA-256 hash of roundSalt:normalizedTerm using Web Crypto API
export async function hashTerm(roundSalt: string, normalizedTerm: string): Promise<string> {
  const input = `${roundSalt}:${normalizedTerm}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

---

### `src/lib/utils/hint-pool-builder.ts`

```ts
// Select ~25 representative terms from relatedTerms for the hintPool
// Spreads across rank spectrum so dynamic hints can always find a nearby term

const HINT_POOL_RANKS = [
  2, 3, 5, 7, 10, 15, 20, 30, 40, 50, 70, 100, 150, 200, 300, 400, 500, 700, 1000,
];

type RelatedTerm = { term: string; rank: number };

export function buildHintPool(relatedTerms: RelatedTerm[]): RelatedTerm[] {
  const termsByRank = new Map(relatedTerms.map((t) => [t.rank, t]));
  const pool: RelatedTerm[] = [];

  for (const targetRank of HINT_POOL_RANKS) {
    // Find closest available rank
    let closest: RelatedTerm | null = null;
    let minDiff = Infinity;
    for (const [rank, term] of termsByRank) {
      const diff = Math.abs(rank - targetRank);
      if (diff < minDiff) {
        minDiff = diff;
        closest = term;
      }
    }
    if (closest) pool.push(closest);
  }

  return pool;
}
```

---

## Todo checklist

- [ ] Create `src/types/game.types.ts`
- [ ] Create `src/lib/firebase.ts`
- [ ] Create `src/lib/firebase-anonymous-auth.ts`
- [ ] Create `src/stores/game-store.ts`
- [ ] Create `src/stores/admin-store.ts`
- [ ] Create `src/lib/utils/normalize-vi.ts`
- [ ] Create `src/lib/utils/term-hash.ts`
- [ ] Create `src/lib/utils/hint-pool-builder.ts`
- [ ] Run `bun run build` — no TypeScript errors

---

## Success criteria

- All types compile cleanly
- `ensureAnonymousUser()` signs in via Firebase emulator (or real project)
- `hashTerm()` produces consistent hex string for same input
