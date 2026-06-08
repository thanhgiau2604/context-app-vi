import { motion } from "motion/react";

type Props = { keyword: string };

export function KeywordRevealCard({ keyword }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-rank-exact/40 bg-rank-exact/10 p-4 text-center"
    >
      <p className="text-xs text-muted-foreground mb-1">Đáp án là:</p>
      <p className="text-2xl font-bold text-rank-exact">{keyword}</p>
    </motion.div>
  );
}
