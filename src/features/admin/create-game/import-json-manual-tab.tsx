import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import {
  GeneratedRoundSchema,
  validateGeneratedRound,
  type GeneratedRound,
} from "@/lib/gemini/generated-round-zod-schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/tailwind-class-merge-utils";

type Props = {
  onValidated: (data: GeneratedRound) => void;
};

export function ImportJsonManualTab({ onValidated }: Props) {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [valid, setValid] = useState(false);

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

  return (
    <div className="flex flex-col gap-3">
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
