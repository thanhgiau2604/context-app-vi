import { nanoid } from "nanoid";
import { generateRoundWithGemini } from "@/lib/gemini/gemini-round-generation-service";
import { normalizeVietnamese } from "@/lib/utils/normalize-vietnamese-text";
import { hashTerm } from "@/lib/utils/sha256-term-hash";
import {
  createRound,
  updateRoundStatus,
} from "@/lib/firestore/round-with-embedded-terms-firestore-repository";
import type { GeneratedRound } from "@/lib/gemini/generated-round-zod-schema";
import type { RoundTerm } from "@/types/game-firestore-types";

type CreateGameInput = {
  adminUid: string;
  apiKey: string;
  model: string;
  topic?: string;
  difficulty?: "easy" | "medium" | "hard";
  preValidated?: GeneratedRound; // skip Gemini call when importing JSON manually
};

export type CreateGameProgress = {
  step: "generating" | "validating" | "hashing" | "writing" | "done";
  message: string;
};

export type CreateGameResult = {
  roundId: string;
  keyword: string;
  previewTerms: Array<{ term: string; rank: number }>;
};

export async function createGame(
  input: CreateGameInput,
  onProgress: (p: CreateGameProgress) => void,
): Promise<CreateGameResult> {
  let generated: GeneratedRound;

  if (input.preValidated) {
    generated = input.preValidated;
    onProgress({ step: "validating", message: "Dữ liệu đã được xác thực." });
  } else {
    onProgress({ step: "generating", message: "Gemini đang tạo keyword và 500 từ liên quan…" });
    generated = await generateRoundWithGemini({
      apiKey: input.apiKey,
      model: input.model,
      topic: input.topic,
      difficulty: input.difficulty,
    });
  }

  onProgress({ step: "hashing", message: "Đang xử lý và hash dữ liệu…" });

  const roundSalt = nanoid(16);
  const normalizedKeyword = normalizeVietnamese(generated.keyword);
  const keywordHash = await hashTerm(roundSalt, normalizedKeyword);

  // Build terms array with normalized field for client-side lookup
  const terms: RoundTerm[] = await Promise.all(
    generated.relatedTerms.map(async (t) => ({
      term: t.term,
      normalized: normalizeVietnamese(t.term),
      rank: t.rank,
    })),
  );

  onProgress({ step: "writing", message: "Đang lưu vào database…" });

  const roundId = await createRound({
    adminUid: input.adminUid,
    roundSalt,
    keywordHash,
    terms,
    keyword: generated.keyword,
    normalizedKeyword,
  });

  await updateRoundStatus(roundId, "ready");

  onProgress({ step: "done", message: "Round đã sẵn sàng!" });

  return {
    roundId,
    keyword: generated.keyword,
    previewTerms: generated.relatedTerms.slice(0, 20),
  };
}
