import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { fireSolvedConfetti } from "./solved-confetti-burst-effect";

type Props = {
  visible: boolean;
  keyword: string;
  score: number;
  onDismiss: () => void;
};

export function SolvedCelebrationOverlay({ visible, keyword, score, onDismiss }: Props) {
  // Fire confetti once when overlay becomes visible
  useEffect(() => {
    if (visible) fireSolvedConfetti();
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-rank-exact/50 bg-game-surface-1 p-8 text-center shadow-2xl max-w-sm mx-4"
          >
            <p className="text-4xl">🎉</p>
            <h2 className="text-2xl font-bold text-rank-exact">Chính xác!</h2>
            <div className="rounded-xl border border-rank-exact/40 bg-rank-exact/10 px-6 py-3">
              <span className="text-xl font-bold text-rank-exact">{keyword}</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Điểm round: <span className="font-bold text-foreground">+{score}</span>
            </p>
            <Button onClick={onDismiss} className="w-full">
              Xem bảng điểm
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
