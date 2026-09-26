import { useState } from "react";
import { Send, Sigma } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathKeyboard } from "@/components/MathKeyboard";
import { MathPreview, useMathEditing } from "@/components/mathEditing";

interface MathChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder?: string;
  pending?: boolean;
  rows?: number;
  minHeightClass?: string;
}

/**
 * A tutor/chat input with the same on-screen math keyboard the answer fields
 * use, so students can compose economics notation ($P$, $Q$, $\Sigma$, $\beta$, …)
 * when asking questions — not just plain text. The keyboard toggles open from
 * the Σ button and inserts at the cursor.
 */
export function MathChatInput({
  value,
  onChange,
  onSend,
  placeholder,
  pending,
  rows = 3,
  minHeightClass = "min-h-[72px]",
}: MathChatInputProps) {
  const editor = useMathEditing(value, onChange);
  const [showKeyboard, setShowKeyboard] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-end">
        <textarea
          ref={editor.ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            editor.handleSlotKeyDown(e);
            if (e.defaultPrevented) return;
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          rows={rows}
          className={`flex-1 bg-secondary border-none rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-y ${minHeightClass} max-h-[280px]`}
          data-testid="input-math-chat"
        />
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            size="lg"
            variant={showKeyboard ? "default" : "outline"}
            onClick={() => setShowKeyboard((v) => !v)}
            title={showKeyboard ? "Hide math keyboard" : "Show math keyboard"}
            aria-label={showKeyboard ? "Hide Math keyboard" : "Math keyboard"}
            aria-expanded={showKeyboard}
            data-testid="button-toggle-math-keyboard"
          >
            <Sigma className="w-4 h-4 mr-1" /> Math
          </Button>
          <Button
            size="lg"
            onClick={onSend}
            disabled={!value.trim() || pending}
            data-testid="button-send-math-chat"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <MathPreview value={value} />
      {showKeyboard && (
        <MathKeyboard
          onInsert={editor.insert}
          onTemplate={(text) => editor.insert(text, "template")}
          onNextSlot={editor.nextSlot}
          onBackspace={editor.backspace}
          onClear={editor.clear}
        />
      )}
    </div>
  );
}
