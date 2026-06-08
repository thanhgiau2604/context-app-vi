import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { ensureAnonymousUser } from '@/lib/firebase-anonymous-auth'
import { getRoom } from '@/lib/firestore/room-firestore-repository'
import { joinRoom } from '@/lib/firestore/player-firestore-repository'
import { useGameStore } from '@/stores/game-session-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export function PlayerJoinRoomPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setRoom, setPlayer } = useGameStore()

  const roomIdParam = searchParams.get('room') ?? ''
  const [roomId, setRoomId] = useState(roomIdParam.toUpperCase())
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (roomIdParam) setRoomId(roomIdParam.toUpperCase())
  }, [roomIdParam])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedRoom = roomId.trim().toUpperCase()
    if (!trimmedName || !trimmedRoom) return

    setLoading(true)
    try {
      const room = await getRoom(trimmedRoom)
      if (!room) { toast.error('Phòng không tồn tại.'); return }
      if (room.status === 'ended') { toast.error('Phòng đã kết thúc.'); return }

      const user = await ensureAnonymousUser()
      await joinRoom(trimmedRoom, user.uid, trimmedName)
      setRoom(trimmedRoom)
      setPlayer(user.uid, trimmedName, false)
      navigate(`/room/${trimmedRoom}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gradient-brand">Contextto Việt</CardTitle>
          <p className="text-sm text-muted-foreground">Game đoán từ tiếng Việt</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="room-code">Mã phòng</Label>
              <Input
                id="room-code"
                placeholder="VD: ABCD1234"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                maxLength={8}
                className="font-mono tracking-widest uppercase"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="player-name">Tên của bạn</Label>
              <Input
                id="player-name"
                placeholder="Nhập tên..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoFocus={!!roomIdParam}
              />
            </div>
            <Button type="submit" disabled={loading || !name.trim() || !roomId.trim()}>
              {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <LogIn size={16} className="mr-2" />}
              Tham gia
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Không cần đăng nhập
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
