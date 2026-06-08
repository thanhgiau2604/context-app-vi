import { getRankTier, rankTierColorClass } from '@/lib/utils/rank-tier-color-classifier'
import { cn } from '@/lib/tailwind-class-merge-utils'

type Props = { rank: number | null; size?: 'sm' | 'md' | 'lg' }

export function RankBadge({ rank, size = 'md' }: Props) {
  const tier = getRankTier(rank)
  return (
    <span className={cn(
      'inline-flex items-center justify-center rounded-md font-mono font-bold border tabular-nums',
      size === 'sm' && 'px-1.5 py-0.5 text-xs',
      size === 'md' && 'px-2 py-1 text-sm',
      size === 'lg' && 'px-3 py-1.5 text-base',
      rankTierColorClass[tier]
    )}>
      {rank === null ? '???' : `#${rank}`}
    </span>
  )
}
