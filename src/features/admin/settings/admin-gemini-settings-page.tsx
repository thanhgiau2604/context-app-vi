import { useEffect, useState } from 'react'
import { Eye, EyeOff, Loader2, Plug, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminStore, type GeminiModel } from '@/stores/admin-gemini-settings-store'
import { testGeminiConnection } from '@/lib/gemini/gemini-round-generation-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AdminGeminiSettingsPage() {
  const { geminiApiKey, geminiModel, rememberKey, setGeminiApiKey, setGeminiModel, clearGeminiKey, loadSavedSettings } =
    useAdminStore()

  const [keyInput, setKeyInput] = useState(geminiApiKey)
  const [showKey, setShowKey] = useState(false)
  const [remember, setRemember] = useState(rememberKey)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    loadSavedSettings()
  }, [loadSavedSettings])

  useEffect(() => {
    setKeyInput(geminiApiKey)
    setRemember(rememberKey)
  }, [geminiApiKey, rememberKey])

  async function handleTest() {
    if (!keyInput.trim()) {
      toast.error('Nhập API key trước.')
      return
    }
    setTesting(true)
    try {
      await testGeminiConnection(keyInput.trim(), geminiModel)
      setGeminiApiKey(keyInput.trim(), remember)
      toast.success('Kết nối Gemini thành công!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Kết nối thất bại.')
    } finally {
      setTesting(false)
    }
  }

  function handleClear() {
    clearGeminiKey()
    setKeyInput('')
    setRemember(false)
    toast.info('Đã xoá API key.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Cài đặt Gemini AI</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="gemini-key">Gemini API Key</Label>
            <div className="relative">
              <Input
                id="gemini-key"
                type={showKey ? 'text' : 'password'}
                placeholder="AIza..."
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="gemini-model">Model</Label>
            <Select value={geminiModel} onValueChange={(v) => setGeminiModel(v as GeminiModel)}>
              <SelectTrigger id="gemini-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini-2.5-flash">gemini-2.5-flash (nhanh)</SelectItem>
                <SelectItem value="gemini-2.5-pro">gemini-2.5-pro (chất lượng cao)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Switch id="remember-key" checked={remember} onCheckedChange={setRemember} />
            <Label htmlFor="remember-key" className="cursor-pointer">
              Lưu key trên thiết bị này
            </Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTest} disabled={testing} className="flex-1">
              {testing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Plug size={16} className="mr-2" />}
              Kiểm tra kết nối
            </Button>
            <Button variant="outline" onClick={handleClear}>
              <Trash2 size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
