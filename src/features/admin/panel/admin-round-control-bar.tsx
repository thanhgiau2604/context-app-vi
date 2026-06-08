import { useState } from 'react'
import { Loader2, SkipForward, StopCircle } from 'lucide-react'
import { toast } from 'sonner'
import { updateRoomStatus } from '@/lib/firestore/room-firestore-repository'
import { updateRoundStatus } from '@/lib/firestore/round-firestore-repository'
import { Button } from '@/components/ui/button'

type Props = {
  roomId: string
  roundId: string
  activePlayers: number
  finishedPlayers: number
  onNextRound: () => void
}

export function AdminRoundControlBar({ roomId, roundId, activePlayers, finishedPlayers, onNextRound }: Props) {
  const [ending, setEnding] = useState(false)
  const allDone = activePlayers > 0 && finishedPlayers >= activePlayers

  async function handleEndRoom() {
    setEnding(true)
    try {
      await updateRoundStatus(roomId, roundId, 'completed')
      await updateRoomStatus(roomId, 'ended')
    } catch {
      toast.error('Không thể kết thúc phòng.')
    } finally {
      setEnding(false)
    }
  }

  return (
    <div className="flex gap-2 rounded-xl border border-border bg-muted/10 p-3">
      <Button
        size="sm"
        variant="secondary"
        disabled={!allDone}
        onClick={onNextRound}
        title={!allDone ? `Còn ${activePlayers - finishedPlayers} người chưa xong` : undefined}
        className="flex-1"
      >
        <SkipForward size={14} className="mr-2" />
        Round tiếp ({finishedPlayers}/{activePlayers})
      </Button>
      <Button size="sm" variant="outline" disabled={ending} onClick={handleEndRoom}>
        {ending ? <Loader2 size={14} className="animate-spin" /> : <StopCircle size={14} />}
      </Button>
    </div>
  )
}
