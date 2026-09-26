import React, { useRef, useState, useEffect, useCallback } from "react";
import { KeystrokeTrace } from "@workspace/api-client-react";
import { MathKeyboard } from "@/components/MathKeyboard";
import { QuickPickBar } from "@/components/QuickPickBar";
import { MathPreview, useMathEditing } from "@/components/mathEditing";

interface AnswerInputProps {
  value: string;
  onChange: (val: string, trace: KeystrokeTrace) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Source text (the question prompt) used to derive the per-question quick-pick symbol bar. */
  promptSource?: string;
}

export function AnswerInput({ value, onChange, placeholder, disabled, promptSource }: AnswerInputProps) {
  const [sessionValue, setSessionValue] = useState(value);
  const [showKeyboard, setShowKeyboard] = useState(true);

  const traceRef = useRef<KeystrokeTrace>({
    keystrokeCount: 0,
    eraseCount: 0,
    bulkInsertCount: 0,
    longestBulkInsertChars: 0,
    rewriteSegments: 0,
    durationMs: 0,
  });

  const sessionStartRef = useRef<number>(Date.now());
  const lastKeyWasEraseRef = useRef<boolean>(false);

  useEffect(() => {
    setSessionValue(value);
  }, [value]);

  const emitChange = useCallback(
    (newVal: string) => {
      const trace = {
        ...traceRef.current,
        durationMs: Date.now() - sessionStartRef.current,
      };
      onChange(newVal, trace);
    },
    [onChange],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const diff = newVal.length - sessionValue.length;

    if (diff > 5) {
      traceRef.current.bulkInsertCount = (traceRef.current.bulkInsertCount || 0) + 1;
      if (diff > (traceRef.current.longestBulkInsertChars || 0)) {
        traceRef.current.longestBulkInsertChars = diff;
      }
    }

    setSessionValue(newVal);
    emitChange(newVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isErase = e.key === "Backspace" || e.key === "Delete";

    if (isErase) {
      traceRef.current.eraseCount += 1;
      if (!lastKeyWasEraseRef.current) {
        traceRef.current.rewriteSegments = (traceRef.current.rewriteSegments || 0) + 1;
      }
      lastKeyWasEraseRef.current = true;
    } else if (e.key.length === 1 || e.key === "Enter") {
      traceRef.current.keystrokeCount += 1;
      lastKeyWasEraseRef.current = false;
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => e.preventDefault();

  const editor = useMathEditing(sessionValue, (next, action) => {
    if (action === "insert" || action === "template") {
      // A button press is one intentional action, regardless of inserted length.
      traceRef.current.keystrokeCount += 1;
      lastKeyWasEraseRef.current = false;
    } else {
      traceRef.current.eraseCount += 1;
      if (!lastKeyWasEraseRef.current) {
        traceRef.current.rewriteSegments = (traceRef.current.rewriteSegments || 0) + 1;
      }
      lastKeyWasEraseRef.current = true;
    }
    setSessionValue(next);
    emitChange(next);
  });

  return (
    <div className="flex flex-col gap-2 w-full">
      {!disabled && promptSource ? (
        <QuickPickBar source={promptSource} onInsert={editor.insert} />
      ) : null}
      <textarea
        ref={editor.ref}
        value={sessionValue}
        onChange={handleChange}
        onKeyDown={(e) => { editor.handleSlotKeyDown(e); if (!e.defaultPrevented) handleKeyDown(e); }}
        onPaste={handlePaste}
        onDrop={handleDrop}
        placeholder={placeholder || "Type your answer here..."}
        disabled={disabled}
        className="w-full min-h-[180px] p-5 bg-card border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-3xl leading-relaxed resize-y"
      />
      <MathPreview value={sessionValue} />
      <span className="text-xs text-muted-foreground px-1">Pasting is disabled.</span>
      {!disabled && (
        <>
          <button type="button" onClick={() => setShowKeyboard((open) => !open)}
            aria-expanded={showKeyboard} className="self-start rounded-md border border-primary/40 px-3 py-2 text-sm font-medium hover:bg-muted"
            data-testid="button-toggle-answer-math-keyboard">
            {showKeyboard ? "Hide Math keyboard" : "Math keyboard ∑"}
          </button>
          {showKeyboard && <MathKeyboard onInsert={editor.insert} onTemplate={(text) => editor.insert(text, "template")}
            onNextSlot={editor.nextSlot} onBackspace={editor.backspace} onClear={editor.clear} />}
        </>
      )}
    </div>
  );
}
