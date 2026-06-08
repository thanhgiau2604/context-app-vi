import { AnimatePresence, motion } from 'motion/react'
import { Flag, Trophy } from 'lucide-react'
import { usePublicResultsRealtime } from '@/hooks/use-public-results-realtime-listener'
import { RankBadge } from '@/components/ui/rank-display-badge'
import { cn } from '@/lib/tailwind-class-merge-utils'

type Props = { roomId: string; roundId: string; activePlayers: number }

// Sort: solved first (by finishOrder asc), then surrendered (by bestRank asc)
function sortResults(results: ReturnType<typeof usePublicResultsRealtime>) {
  return [...results].sort((a, b) => {
    if (a.status === 'solved' && b.status !== 'solved') return -1
    if (b.status === 'solved' && a.status !== 'solved') return 1
    if (a.status === 'solved') return a.finishOrder - b.finishOrder
    const ar = a.bestRank ?? Infinity, br = b.bestRank ?? Infinity
    return ar - br
  })
}

export function RealtimeRoundResultsBoard({ roomId, roundId, activePlayers }: Props) {
  const results = usePublicResultsRealtime(roomId, roundId)
  const sorted = sortResults(results)
  const waiting = activePlayers - results.length

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Kết quả round</span>
        {waiting > 0 && (
          <span className="text-xs text-muted-foreground animate-pulse">Đang chờ {waiting} người…</span>
        )}
      </div>

      {sorted.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">Chưa có ai hoàn thành.</p>
      )}

      <AnimatePresence initial={false}>
        {sorted.map((r, i) => (
          <motion.div
            key={r.uid}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: i * 0.04 }}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
              r.status === 'solved'
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-border bg-muted/10 text-muted-foreground'
            )}
          >
            {r.status === 'solved'
              ? <Trophy size={14} className="shrink-0" />
              : <Flag size={14} className="shrink-0" />}
            <span className="flex-1 font-medium truncate">{r.name}</span>
            <RankBadge rank={r.bestRank} size="sm" />
            <span className="font-mono text-xs">+{r.roundScore}đ</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
