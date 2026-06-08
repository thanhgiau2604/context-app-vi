import { useState } from "react";
import { Loader2, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  createGame,
  type CreateGameProgress,
  type CreateGameResult,
} from "./create-game-orchestration-service";
import { ImportJsonManualTab } from "./import-json-manual-tab";
import { useAdminStore } from "@/stores/admin-gemini-settings-store";
import type { GeneratedRound } from "@/lib/gemini/generated-round-zod-schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Step = "idle" | "generating" | "preview" | "confirming" | "done" | "error";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roomId: string;
  adminUid: string;
  onDone: (result: CreateGameResult) => void;
};

export function CreateGameModalDialog({ open, onOpenChange, roomId, adminUid, onDone }: Props) {
  const { geminiApiKey, geminiModel } = useAdminStore();
  const [step, setStep] = useState<Step>("idle");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [progress, setProgress] = useState<CreateGameProgress | null>(null);
  const [result, setResult] = useState<CreateGameResult | null>(null);
  const [pendingJson, setPendingJson] = useState<GeneratedRound | null>(null);

  function handleProgress(p: CreateGameProgress) {
    setProgress(p);
    if (p.step === "done") setStep("preview");
    else setStep("generating");
  }

  async function handleGenerate() {
    if (!geminiApiKey) {
      toast.error("Chưa cài API key Gemini. Vào Cài đặt trước.");
      return;
    }
    setStep("generating");
    setResult(null);
    try {
      const r = await createGame(
        {
          roomId,
          adminUid,
          apiKey: geminiApiKey,
          model: geminiModel,
          topic: topic || undefined,
          difficulty,
        },
        handleProgress,
      );
      setResult(r);
      setStep("preview");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo game.");
      setStep("error");
    }
  }

  async function handleImportConfirm() {
    if (!pendingJson) return;
    setStep("confirming");
    try {
      const r = await createGame(
        { roomId, adminUid, apiKey: geminiApiKey, model: geminiModel, preValidated: pendingJson },
        handleProgress,
      );
      setResult(r);
      setStep("done");
      onDone(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi ghi dữ liệu.");
      setStep("error");
    }
  }

  function handleConfirmAndStart() {
    if (!result) return;
    setStep("done");
    onDone(result);
    onOpenChange(false);
  }

  function reset() {
    setStep("idle");
    setProgress(null);
    setResult(null);
    setPendingJson(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo game mới</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="gemini">
          <TabsList className="w-full">
            <TabsTrigger value="gemini" className="flex-1">
              Gemini AI
            </TabsTrigger>
            <TabsTrigger value="json" className="flex-1">
              Import JSON
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gemini" className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <Label>Chủ đề (tuỳ chọn)</Label>
              <Input
                placeholder="VD: Thể thao, Ẩm thực, Thiên nhiên…"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={step === "generating"}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Độ khó</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as typeof difficulty)}
                disabled={step === "generating"}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Dễ — từ phổ biến</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó — từ ít phổ biến</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={step === "generating" || step === "confirming"}
            >
              {step === "generating" ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  {progress?.message ?? "Đang tạo…"}
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Tạo với Gemini
                </>
              )}
            </Button>

            {result && step === "preview" && (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Keyword:</span>
                  <Badge className="rank-exact font-mono text-sm">{result.keyword}</Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Top 20 từ liên quan:</span>
                  <div className="grid grid-cols-2 gap-1">
                    {result.previewTerms.map((t) => (
                      <div key={t.rank} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-muted-foreground w-8">#{t.rank}</span>
                        <span>{t.term}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={handleConfirmAndStart} className="mt-1">
                  <CheckCircle size={16} className="mr-2" />
                  Xác nhận &amp; Bắt đầu round
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="json" className="flex flex-col gap-4 pt-2">
            <ImportJsonManualTab onValidated={setPendingJson} />
            {pendingJson && (
              <Button onClick={handleImportConfirm} disabled={step === "confirming"}>
                {step === "confirming" ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    {progress?.message}
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Xác nhận &amp; Tạo game
                  </>
                )}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
