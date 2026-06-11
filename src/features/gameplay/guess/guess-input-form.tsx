import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitGuess } from "./guess-submission-service";
import { publishLiveProgress } from "@/lib/firestore/live-round-progress-firestore-repository";
import { calculateRoundScore } from "@/lib/utils/round-score-calculator";
import { useGameStore } from "@/stores/game-session-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    } catch {
      toast.error("Lỗi kết nối. Thử lại.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 game-card game-glow p-2 rounded-2xl transition-shadow focus-within:ring-2 focus-within:ring-ring/60"
    >
      <Input
        ref={inputRef}
        placeholder="Nhập từ đoán…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={loading || disabled}
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
