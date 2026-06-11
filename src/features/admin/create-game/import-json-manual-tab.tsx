import { useState } from "react";
import { CheckCircle, XCircle, Copy, ChevronDown, ChevronUp, Check } from "lucide-react";
import {
  GeneratedRoundSchema,
  validateGeneratedRound,
  type GeneratedRound,
} from "@/lib/gemini/generated-round-zod-schema";
import { buildVietnameseContextoPrompt } from "@/lib/gemini/vietnamese-contexto-prompt-builder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/tailwind-class-merge-utils";

type Props = {
  onValidated: (data: GeneratedRound) => void;
};

export function ImportJsonManualTab({ onValidated }: Props) {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [valid, setValid] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  const prompt = buildVietnameseContextoPrompt();

  function handleValidate() {
    setErrors([]);
    setValid(false);
    try {
      const parsed = JSON.parse(text);
      const result = GeneratedRoundSchema.safeParse(parsed);
      if (!result.success) {
        setErrors(result.error.issues.map((i) => i.message));
        return;
      }
      const extra = validateGeneratedRound(result.data);
      if (extra.length > 0) {
        setErrors(extra);
        return;
      }
      setValid(true);
      onValidated(result.data);
    } catch {
      setErrors(["JSON không hợp lệ — kiểm tra cú pháp."]);
    }
  }

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Prompt reveal section */}
      <div className="rounded-lg border border-border/60 bg-muted/10">
        <button
          type="button"
          onClick={() => setShowPrompt((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted/20 rounded-lg transition-colors"
        >
          <span>📋 Prompt dành cho AI agent</span>
          {showPrompt ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showPrompt && (
          <div className="border-t border-border/60 px-3 pb-3 pt-2 flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Copy prompt này, dán vào bất kỳ AI agent nào (ChatGPT, Gemini, Claude…) để tạo keyword
              + 499 từ liên quan. Sau đó dán JSON trả về vào ô bên dưới.
            </p>
            <pre className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed">
              {prompt}
            </pre>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyPrompt}
              className="self-start"
            >
              {copied ? (
                <>
                  <Check size={14} className="mr-1.5 text-green-400" /> Đã copy!
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-1.5" /> Copy prompt
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* JSON paste area */}
      <textarea
        className="h-48 w-full rounded-md border border-border bg-muted/20 p-3 font-mono text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder={'{ "keyword": "...", "relatedTerms": [...] }'}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setValid(false);
          setErrors([]);
        }}
      />
      <Button variant="outline" onClick={handleValidate} disabled={!text.trim()}>
        Xác thực JSON
      </Button>
      {valid && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle size={16} /> Dữ liệu hợp lệ — nhấn Xác nhận để tạo game.
        </div>
      )}
      {errors.length > 0 && (
        <ul className="flex flex-col gap-1">
          {errors.map((e, i) => (
            <li key={i} className={cn("flex items-start gap-2 text-xs text-destructive")}>
              <XCircle size={14} className="mt-0.5 shrink-0" /> {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
