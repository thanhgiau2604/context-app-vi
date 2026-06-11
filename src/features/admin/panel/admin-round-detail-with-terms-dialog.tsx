import { useEffect, useState } from "react";
import { Loader2, Crown, KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getRoundKeyword } from "@/lib/firestore/round-with-embedded-terms-firestore-repository";
import { getRankTier, rankTierColorClass } from "@/lib/utils/rank-tier-color-classifier";
import { cn } from "@/lib/tailwind-class-merge-utils";
import type { Round } from "@/types/game-firestore-types";

type RoundDetailDialogProps = {
  round: Round | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Read-only admin view: reveals the secret keyword (rank 1) + all 499 related terms,
// rank-sorted and color-coded by tier (DESIGN.md §18 rank classes).
export function RoundDetailDialog({ round, open, onOpenChange }: RoundDetailDialogProps) {
  const [keyword, setKeyword] = useState<string | null>(null);
  const [loadingKeyword, setLoadingKeyword] = useState(false);

  useEffect(() => {
    if (!open || !round) return;
    setKeyword(null);
    setLoadingKeyword(true);
    let cancelled = false;
    void getRoundKeyword(round.roundId)
      .then((kw) => {
        if (!cancelled) setKeyword(kw);
      })
      .finally(() => {
        if (!cancelled) setLoadingKeyword(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, round]);

  const terms = round ? [...round.terms].sort((a, b) => a.rank - b.rank) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="game-card max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-gradient-brand flex items-center gap-2">
            <KeyRound size={18} aria-hidden="true" />
            Chi tiết game
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {round ? `#${round.roundNumber} · ${round.roundId}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Keyword (rank 1) — highlighted as exact tier */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3",
            rankTierColorClass.exact,
          )}
        >
          <Crown size={20} aria-hidden="true" className="shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
              Đáp án · Hạng 1
            </span>
            {loadingKeyword ? (
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <span className="text-xl font-bold">{keyword ?? "—"}</span>
            )}
          </div>
        </div>

        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {terms.length} từ liên quan (hạng 2–{(round?.termCount ?? 0) + 1})
        </p>

        {/* Related terms grid — rank-sorted, color-coded by tier */}
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 overflow-y-auto pr-1 flex-1">
          {terms.map((t) => (
            <li
              key={t.rank}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm",
                rankTierColorClass[getRankTier(t.rank)],
              )}
            >
              <span className="font-mono text-xs font-bold opacity-70 w-8 shrink-0">{t.rank}</span>
              <span className="truncate font-medium">{t.term}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
