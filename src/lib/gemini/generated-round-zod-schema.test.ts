import { describe, it, expect } from "vite-plus/test";
import {
  RelatedTermSchema,
  GeneratedRoundSchema,
  validateGeneratedRound,
} from "./generated-round-zod-schema";

// Build N valid related terms starting at rank 2.
function buildTerms(n: number, startRank = 2) {
  return Array.from({ length: n }, (_, i) => ({ term: `từ-${i}`, rank: startRank + i }));
}

describe("RelatedTermSchema rank bounds", () => {
  it("accepts rank 2..500", () => {
    expect(RelatedTermSchema.safeParse({ term: "a", rank: 2 }).success).toBe(true);
    expect(RelatedTermSchema.safeParse({ term: "a", rank: 500 }).success).toBe(true);
  });

  it("rejects rank 501 (corpus is 500, terms rank 2–500)", () => {
    expect(RelatedTermSchema.safeParse({ term: "a", rank: 501 }).success).toBe(false);
  });

  it("rejects rank 1 (reserved for keyword)", () => {
    expect(RelatedTermSchema.safeParse({ term: "a", rank: 1 }).success).toBe(false);
  });
});

describe("GeneratedRoundSchema + validateGeneratedRound", () => {
  it("valid 499-term round (rank 2–500) passes", () => {
    const round = { keyword: "cà phê", relatedTerms: buildTerms(499) };
    const parsed = GeneratedRoundSchema.safeParse(round);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(validateGeneratedRound(parsed.data)).toEqual([]);
  });

  it("flags keyword not exactly 2 words", () => {
    const round = { keyword: "cà", relatedTerms: buildTerms(499) };
    const parsed = GeneratedRoundSchema.parse(round);
    expect(validateGeneratedRound(parsed).some((e) => e.includes("2 từ"))).toBe(true);
  });

  it("flags duplicate ranks", () => {
    const terms = buildTerms(499);
    terms[1].rank = terms[0].rank; // dup
    const round = { keyword: "cà phê", relatedTerms: terms };
    const parsed = GeneratedRoundSchema.parse(round);
    expect(validateGeneratedRound(parsed).some((e) => e.includes("Rank bị trùng"))).toBe(true);
  });

  it("flags keyword appearing in relatedTerms", () => {
    const terms = buildTerms(499);
    terms[0].term = "cà phê";
    const round = { keyword: "cà phê", relatedTerms: terms };
    const parsed = GeneratedRoundSchema.parse(round);
    expect(validateGeneratedRound(parsed).some((e) => e.includes("Keyword xuất hiện"))).toBe(true);
  });

  it("flags missing rank 2 start", () => {
    // ranks 3..500 (498 terms) — within schema bounds but no rank 2
    const round = { keyword: "cà phê", relatedTerms: buildTerms(498, 3) };
    const parsed = GeneratedRoundSchema.parse(round);
    expect(validateGeneratedRound(parsed).some((e) => e.includes("bắt đầu từ rank 2"))).toBe(true);
  });
});
