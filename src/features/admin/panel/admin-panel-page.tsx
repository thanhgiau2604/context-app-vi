import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Plus, Settings, Gamepad2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { ensureAnonymousUser } from '@/lib/firebase-anonymous-auth'
import { signOutAdmin } from '@/lib/firebase-email-password-auth-service'
import { createRoom } from '@/lib/firestore/room-firestore-repository'
import { useGameStore } from '@/stores/game-session-store'
import { CreateGameModalDialog } from '@/features/admin/create-game/create-game-modal-dialog'
import type { CreateGameResult } from '@/features/admin/create-game/create-game-orchestration-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AdminPanelPage() {
  const navigate = useNavigate()
  const { setRoom, setPlayer, roomId, uid } = useGameStore()
  const [creating, setCreating] = useState(false)
  const [showCreateGame, setShowCreateGame] = useState(false)

  // Get an anonymous UID for Firestore writes (admin is email-authed in Firebase Auth,
  // but we still need a UID stored in rooms/players docs — reuse auth.currentUser.uid directly)
  useEffect(() => {
    ensureAnonymousUser().then((user) => setPlayer(user.uid, 'Admin', true))
  }, [setPlayer])

  async function handleCreateRoom() {
    setCreating(true)
    try {
      const user = await ensureAnonymousUser()
      const id = await createRoom(user.uid)
      setRoom(id)
      toast.success(`Phòng ${id} đã được tạo!`)
      navigate(`/room/${id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không tạo được phòng.')
    } finally {
      setCreating(false)
    }
  }

  function handleGameCreated(result: CreateGameResult) {
    toast.success(`Game tạo xong! Keyword: ${result.keyword}`)
    if (roomId) navigate(`/room/${roomId}/game`)
  }

  async function handleSignOut() {
    await signOutAdmin()
    toast.info('Đã đăng xuất.')
    // AdminAuthGuard will detect auth change and show login page automatically
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gradient-brand">Admin Dashboard</CardTitle>
            <Button size="icon" variant="ghost" onClick={handleSignOut} title="Đăng xuất">
              <LogOut size={16} />
            </Button>
          </div>
          {roomId && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Phòng hiện tại:</span>
              <Badge variant="outline" className="font-mono">{roomId}</Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={handleCreateRoom} disabled={creating}>
            {creating
              ? <Loader2 size={16} className="mr-2 animate-spin" />
              : <Plus size={16} className="mr-2" />}
            Tạo phòng mới
          </Button>
          {roomId && uid && (
            <Button variant="secondary" onClick={() => setShowCreateGame(true)}>
              <Gamepad2 size={16} className="mr-2" />Tạo game mới
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/admin/settings">
              <Settings size={16} className="mr-2" />Cài đặt Gemini AI
            </Link>
          </Button>
        </CardContent>
      </Card>

      {roomId && uid && (
        <CreateGameModalDialog
          open={showCreateGame}
          onOpenChange={setShowCreateGame}
          roomId={roomId}
          adminUid={uid}
          onDone={handleGameCreated}
        />
      )}
    </div>
  )
}
