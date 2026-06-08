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

// Path: rooms/{roomId}/rounds/{roundId}/termIndex/{hash}
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
