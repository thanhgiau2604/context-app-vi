import { Timestamp } from "firebase/firestore";

// idle: no active session | waiting: players can join lobby | playing: game running | ended: session over
export type GameStatus = "idle" | "waiting" | "playing" | "ended";
// draft: being written | ready: in game library | playing: active round | completed: done
export type RoundStatus = "draft" | "ready" | "playing" | "completed";
export type PlayerRoundStatus = "playing" | "solved" | "surrendered";

// Singleton at gameState/main — replaces rooms/main
export type GameState = {
  adminUid: string;
  status: GameStatus;
  currentRoundId?: string;
  playerCount: number;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
};

// Each entry in rounds/{roundId}/terms[] array
export type RoundTerm = {
  term: string;
  normalized: string; // normalizeVietnamese(term) — used for local lookup
  rank: number; // 2–500 (keyword is rank 1, stored only in private/secret)
};

// Path: rounds/{roundId}
export type Round = {
  roundId: string;
  status: RoundStatus;
  roundNumber: number;
  roundSalt: string;
  keywordHash: string; // hash(roundSalt + normalizedKeyword) for client-side keyword detection
  termCount: number;
  terms: RoundTerm[]; // all 499 related terms (rank 2–500) embedded; loaded once for local lookup
  createdBy: string;
  createdAt: Timestamp;
  startedAt?: Timestamp;
  endedAt?: Timestamp;
};

// Path: rounds/{roundId}/private/secret
export type RoundSecret = {
  keyword: string;
  normalizedKeyword: string;
};

// Path: players/{uid} — top-level collection
export type Player = {
  uid: string;
  name: string;
  joinedAt: Timestamp;
  isActive: boolean;
  totalScore: number;
  lastSeenAt: Timestamp;
};

// Path: rounds/{roundId}/playerRounds/{uid}
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

// Path: rounds/{roundId}/publicResults/{uid}
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

// Path: historyGames/{roundId} — completed game summaries
export type HistoryGame = {
  roundId: string;
  roundNumber: number;
  keyword: string;
  termCount: number;
  playerCount: number;
  completedAt: Timestamp;
};

// Client-only (Zustand + localStorage, not Firestore)
export type LocalGuess = {
  text: string;
  normalizedText: string;
  rank: number | null;
  createdAt: number;
  // true when word not found in round's 500-word corpus — shown as "quá xa" in history
  notFound?: boolean;
};
