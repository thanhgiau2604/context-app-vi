import { create } from "zustand";
import type { LocalGuess } from "@/types/game-firestore-types";

type GameStore = {
  roomId: string | null;
  uid: string | null;
  playerName: string | null;
  isAdmin: boolean;
  currentRoundId: string | null;
  localGuesses: LocalGuess[];
  bestRank: number | null;
  usedHints: number;
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
