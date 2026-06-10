import { create } from "zustand";
import type { LocalGuess, RoundTerm } from "@/types/game-firestore-types";

type GameStore = {
  uid: string | null;
  playerName: string | null;
  isAdmin: boolean;
  currentRoundId: string | null;
  // Round data loaded from Firestore once per round — used for local guess lookup
  roundTerms: RoundTerm[];
  keywordHash: string | null;
  roundSalt: string | null;
  // Per-round state tracked in memory (not persisted to Firestore mid-round)
  localGuesses: LocalGuess[];
  bestRank: number | null;
  usedHints: number;
  setPlayer: (uid: string, name: string, isAdmin?: boolean) => void;
  setRound: (roundId: string) => void;
  setRoundData: (terms: RoundTerm[], keywordHash: string, roundSalt: string) => void;
  addLocalGuess: (guess: LocalGuess) => void;
  updateBestRank: (rank: number) => void;
  incrementUsedHints: () => void;
  resetRoundState: () => void;
  resetAll: () => void;
};

export const useGameStore = create<GameStore>((set) => ({
  uid: null,
  playerName: null,
  isAdmin: false,
  currentRoundId: null,
  roundTerms: [],
  keywordHash: null,
  roundSalt: null,
  localGuesses: [],
  bestRank: null,
  usedHints: 0,

  setPlayer: (uid, name, isAdmin = false) => set({ uid, playerName: name, isAdmin }),
  setRound: (roundId) => set({ currentRoundId: roundId }),
  setRoundData: (roundTerms, keywordHash, roundSalt) => set({ roundTerms, keywordHash, roundSalt }),
  addLocalGuess: (guess) => set((s) => ({ localGuesses: [guess, ...s.localGuesses] })),
  updateBestRank: (rank) =>
    set((s) => ({ bestRank: s.bestRank === null || rank < s.bestRank ? rank : s.bestRank })),
  incrementUsedHints: () => set((s) => ({ usedHints: s.usedHints + 1 })),
  resetRoundState: () =>
    set({
      localGuesses: [],
      bestRank: null,
      usedHints: 0,
      currentRoundId: null,
      roundTerms: [],
      keywordHash: null,
      roundSalt: null,
    }),
  resetAll: () =>
    set({
      uid: null,
      playerName: null,
      isAdmin: false,
      currentRoundId: null,
      roundTerms: [],
      keywordHash: null,
      roundSalt: null,
      localGuesses: [],
      bestRank: null,
      usedHints: 0,
    }),
}));
