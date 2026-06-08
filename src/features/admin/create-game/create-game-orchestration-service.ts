import { generateRoundWithGemini } from "@/lib/gemini/gemini-round-generation-service";
import { normalizeVietnamese } from "@/lib/utils/normalize-vietnamese-text";
import { hashTerm } from "@/lib/utils/sha256-term-hash";
import { buildHintPool } from "@/lib/utils/hint-pool-spread-builder";
import {
  createRound,
  getRoundSalt,
  writeTermIndex,
  writeHintPool,
  writeRoundSecret,
  updateRoundStatus,
} from "@/lib/firestore/round-firestore-repository";
import type { GeneratedRound } from "@/lib/gemini/generated-round-zod-schema";

type CreateGameInput = {
  roomId: string;
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
  const roundId = await createRound(input.roomId, input.adminUid);
  const roundSalt = await getRoundSalt(input.roomId, roundId);

  const normalizedKeyword = normalizeVietnamese(generated.keyword);
  const keywordHash = await hashTerm(roundSalt, normalizedKeyword);

  const termEntries: Array<{ hash: string; rank: number; type: "keyword" | "related" }> = [
    { hash: keywordHash, rank: 1, type: "keyword" },
  ];

  for (const t of generated.relatedTerms) {
    const normalized = normalizeVietnamese(t.term);
    const hash = await hashTerm(roundSalt, normalized);
    termEntries.push({ hash, rank: t.rank, type: "related" });
  }

  const hintPool = buildHintPool(generated.relatedTerms);

  onProgress({ step: "writing", message: "Đang lưu vào database…" });
  await writeTermIndex(input.roomId, roundId, termEntries);
  await writeHintPool(input.roomId, roundId, hintPool);
  await writeRoundSecret(input.roomId, roundId, { keyword: generated.keyword, normalizedKeyword });
  // Mark round ready — it enters the game library; session lifecycle is managed by admin panel
  await updateRoundStatus(input.roomId, roundId, "ready");

  onProgress({ step: "done", message: "Round đã sẵn sàng!" });

  return {
    roundId,
    keyword: generated.keyword,
    previewTerms: generated.relatedTerms.slice(0, 20),
  };
}
