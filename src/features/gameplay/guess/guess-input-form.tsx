import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitGuess } from "./guess-submission-service";
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
  const { roundTerms, keywordHash, roundSalt, addLocalGuess, updateBestRank } = useGameStore();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading || !keywordHash || !roundSalt) return;

    setLoading(true);
    try {
      const result = await submitGuess(trimmed, roundTerms, keywordHash, roundSalt);
      addLocalGuess(result.localGuess);
      if (result.rank !== null) updateBestRank(result.rank);
      if (result.rank === 1) onSolved?.();
      setInput("");
    } catch {
      toast.error("Lỗi kết nối. Thử lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Nhập từ đoán…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={loading || disabled}
        autoComplete="off"
        autoFocus
        className="flex-1"
      />
      <Button type="submit" disabled={loading || !input.trim() || disabled}>
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
      </Button>
    </form>
  );
}
