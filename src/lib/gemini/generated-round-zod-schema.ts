import { z } from "zod";

export const RelatedTermSchema = z.object({
  term: z.string().min(1).max(50),
  rank: z.number().int().min(2).max(500),
});

export const GeneratedRoundSchema = z.object({
  keyword: z.string().min(1),
  // Loose bounds — service layer (gemini-round-generation-service) enforces EXACT 499
  // after sanitize+truncate, then retries if short. See TARGET_TERM_COUNT.
  relatedTerms: z.array(RelatedTermSchema).min(400).max(510),
});

export type GeneratedRound = z.infer<typeof GeneratedRoundSchema>;

// Validates semantic constraints beyond Zod schema
export function validateGeneratedRound(data: GeneratedRound): string[] {
  const errors: string[] = [];

  const words = data.keyword.trim().split(/\s+/);
  if (words.length !== 2) errors.push(`Keyword phải đúng 2 từ, hiện có ${words.length} từ.`);

  const ranks = data.relatedTerms.map((t) => t.rank);
  if (new Set(ranks).size !== ranks.length) errors.push("Rank bị trùng trong relatedTerms.");

  const terms = data.relatedTerms.map((t) => t.term.trim().toLowerCase());
  if (new Set(terms).size !== terms.length) errors.push("Có term trùng nhau sau normalize.");

  const kwNorm = data.keyword.trim().toLowerCase();
  if (terms.includes(kwNorm)) errors.push("Keyword xuất hiện trong relatedTerms.");

  const longTerms = data.relatedTerms.filter((t) => t.term.trim().split(/\s+/).length > 3);
  if (longTerms.length > 0) errors.push(`${longTerms.length} term dài hơn 3 từ.`);

  if (!ranks.includes(2)) errors.push("relatedTerms phải bắt đầu từ rank 2.");

  return errors;
}
