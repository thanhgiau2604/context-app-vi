import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitGuess } from "./guess-submission-service";
import { normalizeVietnamese } from "@/lib/utils/normalize-vietnamese-text";
import { publishLiveProgress } from "@/lib/firestore/live-round-progress-firestore-repository";
import { calculateRoundScore } from "@/lib/utils/round-score-calculator";
import { getRankTier, type RankTier } from "@/lib/utils/rank-tier-color-classifier";
import { useGameStore } from "@/stores/game-session-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/tailwind-class-merge-utils";

// Border/ring tint that warms as the player's best rank improves — visual heat feedback.
const TIER_RING: Record<RankTier, string> = {
  exact: "border-rank-exact/60 focus-within:ring-rank-exact/60",
  ultra: "border-rank-ultra/60 focus-within:ring-rank-ultra/60",
  hot: "border-rank-hot/60 focus-within:ring-rank-hot/60",
  warm: "border-rank-warm/50 focus-within:ring-rank-warm/50",
  close: "border-rank-close/40 focus-within:ring-rank-close/50",
  cool: "border-rank-cool/30 focus-within:ring-rank-cool/40",
  far: "border-white/10 focus-within:ring-ring/60",
  unknown: "border-white/10 focus-within:ring-ring/60",
};

type Props = {
  disabled?: boolean;
  onSolved?: () => void;
};

export function GuessInputForm({ disabled, onSolved }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    roundTerms,
    keywordHash,
    roundSalt,
    localGuesses,
    addLocalGuess,
    updateBestRank,
    bestRank,
    usedHints,
    uid,
    playerName,
    currentRoundId,
  } = useGameStore();

  // Keep input focused so player can guess continuously (focus is lost after the
  // input is briefly disabled during submit).
  useEffect(() => {
    if (!loading && !disabled) inputRef.current?.focus();
  }, [loading, disabled]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading || !keywordHash || !roundSalt) return;

    // Reject repeats: same normalized word already guessed this round.
    const normalized = normalizeVietnamese(trimmed);
    if (normalized && localGuesses.some((g) => g.normalizedText === normalized)) {
      toast.info(`Từ "${trimmed}" đã được đoán trước đó`);
      setInput("");
      return;
    }

    setLoading(true);
    try {
      const result = await submitGuess(trimmed, roundTerms, keywordHash, roundSalt);
      addLocalGuess(result.localGuess);
      if (result.rank !== null) {
        const improved = bestRank === null || result.rank < bestRank;
        updateBestRank(result.rank);
        // Publish live best rank + projected points (no word) so others see real progress (spec §9).
        if (improved && uid && playerName && currentRoundId) {
          const guessCount = useGameStore.getState().localGuesses.length;
          // Projected points if solved now: solve-base minus guess + hint penalties
          // (ignore time/proximity for a stable live estimate). Integer via calculator.
          const liveScore = calculateRoundScore({
            status: "solved",
            bestRank: result.rank,
            durationSec: 0,
            guessCount,
            usedHints,
          });
          void publishLiveProgress(currentRoundId, uid, playerName, result.rank, liveScore);
        }
      }
      if (result.rank === 1) onSolved?.();
      setInput("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi kết nối. Thử lại.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  const tintClass = TIER_RING[getRankTier(bestRank)];

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex gap-2 game-card neon-glow p-2 rounded-2xl border transition-colors focus-within:ring-2",
        tintClass,
      )}
    >
      <Input
        ref={inputRef}
        placeholder="Nhập từ đoán…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={disabled}
        autoComplete="off"
        autoFocus
        aria-label="Nhập từ đoán"
        className="flex-1 h-12 border-0 bg-transparent text-lg font-medium shadow-none focus-visible:ring-0"
      />
      <Button
        type="submit"
        size="lg"
        className="h-12 px-5"
        aria-label="Gửi từ đoán"
        disabled={loading || !input.trim() || disabled}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        ) : (
          <ArrowRight size={18} aria-hidden="true" />
        )}
      </Button>
    </form>
  );
}
