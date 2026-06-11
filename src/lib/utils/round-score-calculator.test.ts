import { describe, it, expect } from "vite-plus/test";
import { calculateRoundScore } from "./round-score-calculator";
import {
  SOLVE_BASE,
  MIN_SOLVE_SCORE,
  GUESS_PENALTY,
  TIME_GRACE_SEC,
  TIME_PENALTY_CAP,
  PROX_THRESHOLD,
  PROX_FACTOR,
  HINT_PENALTIES,
} from "@/lib/config/scoring-config";

describe("calculateRoundScore — spec §8", () => {
  it("solved, 1 guess, 0 hint, within grace → SOLVE_BASE", () => {
    const s = calculateRoundScore({
      status: "solved",
      bestRank: 1,
      durationSec: 10,
      guessCount: 1,
      usedHints: 0,
    });
    expect(s).toBe(SOLVE_BASE);
  });

  it("solved with proximity bonus when bestRank ≤ threshold in window", () => {
    const s = calculateRoundScore({
      status: "solved",
      bestRank: 1,
      durationSec: 10,
      guessCount: 1,
      usedHints: 0,
      firstNearMissWithin60s: true,
    });
    // SOLVE_BASE + (THRESHOLD-1)*FACTOR
    expect(s).toBe(SOLVE_BASE + (PROX_THRESHOLD - 1) * PROX_FACTOR);
  });

  it("guess penalty: SOLVE_BASE - (guessCount-1)*GUESS_PENALTY", () => {
    const s = calculateRoundScore({
      status: "solved",
      bestRank: 1,
      durationSec: 0,
      guessCount: 11,
      usedHints: 0,
    });
    expect(s).toBe(SOLVE_BASE - 10 * GUESS_PENALTY);
  });

  it("solve score floors at MIN_SOLVE_SCORE", () => {
    const s = calculateRoundScore({
      status: "solved",
      bestRank: 1,
      durationSec: 0,
      guessCount: 1000,
      usedHints: 0,
    });
    expect(s).toBe(MIN_SOLVE_SCORE);
  });

  it("time penalty: -1/sec after grace, capped", () => {
    const s = calculateRoundScore({
      status: "solved",
      bestRank: 1,
      durationSec: TIME_GRACE_SEC + 30,
      guessCount: 1,
      usedHints: 0,
    });
    expect(s).toBe(SOLVE_BASE - 30);
  });

  it("time penalty capped at TIME_PENALTY_CAP", () => {
    const s = calculateRoundScore({
      status: "solved",
      bestRank: 1,
      durationSec: TIME_GRACE_SEC + 99999,
      guessCount: 1,
      usedHints: 0,
    });
    expect(s).toBe(SOLVE_BASE - TIME_PENALTY_CAP);
  });

  it("escalating hint penalties [25,45,70]", () => {
    const all3 = HINT_PENALTIES.reduce((a, b) => a + b, 0);
    const s = calculateRoundScore({
      status: "solved",
      bestRank: 1,
      durationSec: 0,
      guessCount: 1,
      usedHints: 3,
    });
    expect(all3).toBe(140);
    expect(s).toBe(SOLVE_BASE - 140);
  });

  it("surrendered: only proximity - hint, no solve/time", () => {
    const s = calculateRoundScore({
      status: "surrendered",
      bestRank: 30,
      durationSec: 5,
      guessCount: 8,
      usedHints: 0,
      firstNearMissWithin60s: true,
    });
    // (50-30)*2 = 40
    expect(s).toBe((PROX_THRESHOLD - 30) * PROX_FACTOR);
  });

  it("surrendered with no near-miss in window → 0", () => {
    const s = calculateRoundScore({
      status: "surrendered",
      bestRank: 80,
      durationSec: 5,
      guessCount: 8,
      usedHints: 1,
    });
    expect(s).toBe(0);
  });

  it("no proximity when flag false even if rank low", () => {
    const s = calculateRoundScore({
      status: "solved",
      bestRank: 1,
      durationSec: 0,
      guessCount: 1,
      usedHints: 0,
      firstNearMissWithin60s: false,
    });
    expect(s).toBe(SOLVE_BASE);
  });

  it("fractional durationSec → integer score (no decimals)", () => {
    const s = calculateRoundScore({
      status: "solved",
      bestRank: 1,
      durationSec: TIME_GRACE_SEC + 30.4, // fractional → fractional time penalty
      guessCount: 1,
      usedHints: 0,
    });
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBe(SOLVE_BASE - 30); // 30.4 rounds to 30
  });

  it("score never negative", () => {
    const s = calculateRoundScore({
      status: "surrendered",
      bestRank: null,
      durationSec: 9999,
      guessCount: 50,
      usedHints: 3,
    });
    expect(s).toBe(0);
  });
});
