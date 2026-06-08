import { motion } from 'motion/react'
import { Lock } from 'lucide-react'
import { getRankTier, rankTierColorClass } from '@/lib/utils/rank-tier-color-classifier'
import { RankBadge } from '@/components/ui/rank-display-badge'
import { cn } from '@/lib/tailwind-class-merge-utils'

type Props = {
  index: number
  term?: string
  rank?: number
  revealed: boolean
}

const PENALTIES = [25, 45, 70]

export function HintSlotFlipCard({ index, term, rank, revealed }: Props) {
  const tier = rank != null ? getRankTier(rank) : 'unknown'

  return (
    <motion.div
      initial={false}
      animate={{ rotateY: revealed ? 0 : 0 }}
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-xl border p-3 min-h-[72px] transition-colors',
        revealed && rank != null ? rankTierColorClass[tier] : 'border-border bg-muted/10'
      )}
    >
      {revealed && term && rank != null ? (
        <>
          <span className="font-semibold text-sm">{term}</span>
          <RankBadge rank={rank} size="sm" />
        </>
      ) : (
        <>
          <Lock size={16} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">-{PENALTIES[index]}đ</span>
        </>
      )}
    </motion.div>
  )
}
