import { useState } from 'react'
import { Lightbulb, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  resolveHint,
  getHintBlockReason,
  getHintBlockMessage,
  type HintResult,
} from './hint-logic-service'
import { updatePlayerRoundAfterHint } from '@/lib/firestore/player-round-firestore-service'
import { HintSlotFlipCard } from './hint-slot-flip-card'
import { useGameStore } from '@/stores/game-session-store'
import { Button } from '@/components/ui/button'

type Props = {
  roomId: string
  roundId: string
  uid: string
  roundStatus: string
}

export function HintPanel({ roomId, roundId, uid, roundStatus }: Props) {
  const { bestRank, usedHints, incrementUsedHints } = useGameStore()
  const [hints, setHints] = useState<(HintResult | null)[]>([null, null, null])
  const [loading, setLoading] = useState(false)

  async function handleHint() {
    const blockReason = getHintBlockReason(bestRank, usedHints, roundStatus)
    if (blockReason) {
      toast.info(getHintBlockMessage(blockReason))
      return
    }

    setLoading(true)
    try {
      const result = await resolveHint(roomId, roundId, bestRank!, usedHints)
      if (!result) {
        toast.info('Không tìm được gợi ý phù hợp.')
        return
      }

      const newHints = [...hints]
      newHints[usedHints] = result
      setHints(newHints)

      const newUsedHints = usedHints + 1
      const newPenalty = result.penalty
      incrementUsedHints()

      await updatePlayerRoundAfterHint(roomId, roundId, uid, {
        usedHints: newUsedHints,
        hintPenalty: newPenalty,
      })
    } catch {
      toast.error('Lỗi khi lấy gợi ý. Thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const blockReason = getHintBlockReason(bestRank, usedHints, roundStatus)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Gợi ý</span>
        <span className="text-xs text-muted-foreground">Phạt: -25 / -45 / -70đ</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <HintSlotFlipCard
            key={i}
            index={i}
            revealed={hints[i] != null}
            term={hints[i]?.term}
            rank={hints[i]?.rank}
          />
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleHint}
        disabled={loading || blockReason !== null}
        title={blockReason ? getHintBlockMessage(blockReason) : undefined}
      >
        {loading
          ? <><Loader2 size={14} className="mr-2 animate-spin" />Đang tìm…</>
          : <><Lightbulb size={14} className="mr-2" />Dùng gợi ý ({3 - usedHints} còn)</>}
      </Button>
    </div>
  )
}
