import { describe, it, expect } from "vite-plus/test";
import {
  parseCommaSeparatedRound,
  buildRawRoundFromCommaText,
} from "./comma-separated-round-parser";

// Build a comma-separated string: keyword + n related terms.
function buildCommaText(n: number, keyword = "cà phê") {
  const terms = Array.from({ length: n }, (_, i) => `từ-${i}`);
  return [keyword, ...terms].join(", ");
}

describe("buildRawRoundFromCommaText", () => {
  it("assigns ranks by position starting at 2", () => {
    const round = buildRawRoundFromCommaText("cà phê, sữa, đường");
    expect(round).toEqual({
      keyword: "cà phê",
      relatedTerms: [
        { term: "sữa", rank: 2 },
        { term: "đường", rank: 3 },
      ],
    });
  });

  it("trims whitespace and drops empty tokens", () => {
    const round = buildRawRoundFromCommaText("  cà phê ,  sữa ,, đường ,");
    expect(round?.relatedTerms).toEqual([
      { term: "sữa", rank: 2 },
      { term: "đường", rank: 3 },
    ]);
  });

  it("truncates excess related terms to 499", () => {
    // keyword + 600 terms → keep only first 499, ranks 2..500
    const round = buildRawRoundFromCommaText(buildCommaText(600));
    expect(round?.relatedTerms.length).toBe(499);
    expect(round?.relatedTerms[498].rank).toBe(500);
  });

  it("returns null when fewer than 2 tokens", () => {
    expect(buildRawRoundFromCommaText("cà phê")).toBeNull();
    expect(buildRawRoundFromCommaText("  ,  ")).toBeNull();
  });
});

describe("parseCommaSeparatedRound", () => {
  it("parses a valid 499-term round", () => {
    const { data, errors } = parseCommaSeparatedRound(buildCommaText(499));
    expect(errors).toEqual([]);
    expect(data?.keyword).toBe("cà phê");
    expect(data?.relatedTerms.length).toBe(499);
    expect(data?.relatedTerms[0]).toEqual({ term: "từ-0", rank: 2 });
    expect(data?.relatedTerms[498].rank).toBe(500);
  });

  it("errors when too few tokens", () => {
    const { data, errors } = parseCommaSeparatedRound("cà phê");
    expect(data).toBeNull();
    expect(errors.length).toBeGreaterThan(0);
  });

  it("flags keyword not exactly 2 words", () => {
    const { data, errors } = parseCommaSeparatedRound(buildCommaText(499, "cà"));
    expect(data).toBeNull();
    expect(errors.some((e) => e.includes("2 từ"))).toBe(true);
  });

  it("flags duplicate terms", () => {
    // 499 terms but with a duplicate so it clears Zod's min-count gate first.
    const terms = Array.from({ length: 499 }, (_, i) => `từ-${i}`);
    terms[1] = terms[0]; // dup
    const { data, errors } = parseCommaSeparatedRound(["cà phê", ...terms].join(", "));
    expect(data).toBeNull();
    expect(errors.some((e) => e.includes("trùng"))).toBe(true);
  });
});
