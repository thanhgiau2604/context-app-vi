import { useRef, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Copy,
  ChevronDown,
  ChevronUp,
  Check,
  Upload,
  FileText,
} from "lucide-react";
import { type GeneratedRound } from "@/lib/gemini/generated-round-zod-schema";
import { parseCommaSeparatedRound } from "@/lib/gemini/comma-separated-round-parser";
import { buildVietnameseContextoPrompt } from "@/lib/gemini/vietnamese-contexto-prompt-builder";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/tailwind-class-merge-utils";

// One parsed .txt file → one game. Tracks per-file validation outcome for display.
export type ParsedFileRound = {
  fileName: string;
  data: GeneratedRound | null;
  errors: string[];
};

type Props = {
  // Emits the valid rounds (one per accepted .txt file) ready to be created.
  onValidated: (rounds: GeneratedRound[]) => void;
};

export function ImportJsonManualTab({ onValidated }: Props) {
  const [results, setResults] = useState<ParsedFileRound[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const prompt = buildVietnameseContextoPrompt();

  // Read + parse each selected .txt file. Each file's comma-separated content = one game.
  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    const parsed: ParsedFileRound[] = await Promise.all(
      files.map(async (file) => {
        try {
          const text = await file.text();
          const { data, errors } = parseCommaSeparatedRound(text);
          return { fileName: file.name, data, errors };
        } catch {
          return { fileName: file.name, data: null, errors: ["Không đọc được file."] };
        }
      }),
    );
    setResults(parsed);
    onValidated(parsed.filter((p) => p.data !== null).map((p) => p.data as GeneratedRound));
  }

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const validCount = results.filter((r) => r.data !== null).length;

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
              + 499 từ liên quan. Lưu mỗi game thành một file .txt (danh sách cách nhau bởi dấu
              phẩy), rồi tải lên bên dưới.
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

      {/* Multi-file .txt upload: each file = one game (comma-separated keyword + 499 terms) */}
      <input
        ref={inputRef}
        type="file"
        accept=".txt,text/plain"
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        <Upload size={16} className="mr-2" />
        Chọn file .txt (mỗi file một game)
      </Button>

      {/* Per-file parse results */}
      {results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((r, i) => (
            <li
              key={i}
              className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/10 px-3 py-2"
            >
              <div className="flex items-center gap-2 text-sm">
                <FileText size={14} className="shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate font-mono text-xs">{r.fileName}</span>
                {r.data ? (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle size={14} /> {r.data.keyword}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <XCircle size={14} /> Lỗi
                  </span>
                )}
              </div>
              {r.errors.length > 0 && (
                <ul className="flex flex-col gap-0.5 pl-6">
                  {r.errors.map((e, j) => (
                    <li key={j} className={cn("text-xs text-destructive")}>
                      {e}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {validCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle size={16} /> {validCount}/{results.length} file hợp lệ — nhấn Xác nhận để tạo
          game.
        </div>
      )}
    </div>
  );
}
