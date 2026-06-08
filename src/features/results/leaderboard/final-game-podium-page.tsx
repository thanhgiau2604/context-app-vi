import { motion } from 'motion/react'
import { useParams, Link } from 'react-router-dom'
import { Trophy, Medal } from 'lucide-react'
import { usePlayersListener } from '@/hooks/use-players-realtime-listener'
import { useGameStore } from '@/stores/game-session-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/tailwind-class-merge-utils'

// Podium render order: 2nd left, 1st center (taller), 3rd right
const PODIUM_ORDER = [1, 0, 2] // indices into sorted players array

const MEDAL_COLORS = ['text-yellow-400', 'text-slate-300', 'text-amber-600']
const PODIUM_HEIGHTS = ['h-20', 'h-28', 'h-16'] // center tallest
const PODIUM_POSITIONS = [1, 0, 2] // display position index

export function FinalGamePodiumPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { isAdmin } = useGameStore()
  const players = usePlayersListener(roomId ?? null)
  const sorted = [...players].sort((a, b) => b.totalScore - a.totalScore)

  const top3 = PODIUM_ORDER.map((idx) => sorted[idx] ?? null)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-2"
      >
        <Trophy size={40} className="text-yellow-400" />
        <h1 className="text-3xl font-bold text-gradient-brand">Kết thúc!</h1>
      </motion.div>

      {/* Podium blocks */}
      <div className="flex items-end justify-center gap-4">
        {top3.map((player, displayIdx) => {
          const rankIdx = PODIUM_POSITIONS[displayIdx]
          return (
            <motion.div
              key={displayIdx}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: displayIdx * 0.3, type: 'spring', stiffness: 200, damping: 18 }}
              className="flex flex-col items-center gap-2"
            >
              <Medal size={20} className={MEDAL_COLORS[rankIdx]} />
              <span className="text-sm font-semibold truncate max-w-[80px] text-center">
                {player?.name ?? '—'}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{player?.totalScore ?? 0}đ</span>
              <div className={cn(
                'w-20 rounded-t-lg bg-primary/30 border border-primary/40 flex items-center justify-center',
                PODIUM_HEIGHTS[rankIdx],
                rankIdx === 0 && 'bg-yellow-400/20 border-yellow-400/40'
              )}>
                <span className={cn('text-2xl font-bold', MEDAL_COLORS[rankIdx])}>
                  #{rankIdx + 1}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Full leaderboard */}
      {sorted.length > 3 && (
        <div className="w-full max-w-sm flex flex-col gap-2">
          {sorted.slice(3).map((p, i) => (
            <div key={p.uid} className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2 text-sm">
              <span className="text-muted-foreground font-mono w-6">#{i + 4}</span>
              <span className="flex-1 truncate">{p.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{p.totalScore}đ</span>
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <Button asChild>
          <Link to="/admin">Tạo phòng mới</Link>
        </Button>
      )}
    </div>
  )
}
