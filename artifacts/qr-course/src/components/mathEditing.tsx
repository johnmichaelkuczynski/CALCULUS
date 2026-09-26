import { useRef, type KeyboardEvent } from "react";
import katex from "katex";

export interface MathTemplate {
  label: string;
  insert: string;
}

// The visible squares are editable slots: click a template, type over the selected
// square, then press Tab (or Next slot) to continue.
export const CALCULUS_TEMPLATES: MathTemplate[] = [
  { label: "Fraction", insert: "\\frac{□}{□}" },
  { label: "Limit", insert: "\\lim_{x\\to □} □" },
  { label: "Derivative", insert: "\\frac{d}{dx}(□)" },
  { label: "Partial derivative", insert: "\\frac{\\partial}{\\partial x}(□)" },
  { label: "Integral", insert: "\\int □\\,dx" },
  { label: "Definite integral", insert: "\\int_{□}^{□} □\\,dx" },
  { label: "Root", insert: "\\sqrt{□}" },
  { label: "Power", insert: "{□}^{□}" },
  { label: "Sum", insert: "\\sum_{n=□}^{□} □" },
  { label: "Taylor", insert: "\\sum_{n=0}^{\\infty}\\frac{f^{(n)}(□)}{n!}(x-□)^n" },
  { label: "sin", insert: "\\sin(□)" },
  { label: "cos", insert: "\\cos(□)" },
  { label: "tan", insert: "\\tan(□)" },
  { label: "ln", insert: "\\ln(□)" },
  { label: "log", insert: "\\log_{□}(□)" },
];

export type Selection = { start: number; end: number };
export type EditResult = { value: string; selection: Selection };

export function insertMath(value: string, selection: Selection, text: string): EditResult {
  const start = Math.min(selection.start, value.length);
  const end = Math.min(selection.end, value.length);
  const slot = text.indexOf("□");
  const replacement = slot >= 0 && end > start
    ? text.slice(0, slot) + value.slice(start, end) + text.slice(slot + 1)
    : text;
  const next = value.slice(0, start) + replacement + value.slice(end);
  const firstSlot = replacement.indexOf("□");
  const pos = start + (firstSlot >= 0 ? firstSlot : replacement.length);
  return { value: next, selection: { start: pos, end: pos + (firstSlot >= 0 ? 1 : 0) } };
}

export function backspaceMath(value: string, selection: Selection): EditResult | null {
  let { start, end } = selection;
  if (start === end) {
    if (start === 0) return null;
    // Backspace a whole Unicode code point rather than half of a surrogate pair.
    start -= [...value.slice(0, start)].at(-1)?.length ?? 1;
  }
  return { value: value.slice(0, start) + value.slice(end), selection: { start, end: start } };
}

export function nextMathSlot(value: string, selection: Selection): Selection | null {
  let pos = value.indexOf("□", selection.end);
  if (pos === -1) pos = value.indexOf("□");
  return pos < 0 ? null : { start: pos, end: pos + 1 };
}

export function useMathEditing(
  value: string,
  onChange: (next: string, action: "insert" | "template" | "back" | "clear") => void,
) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  function selection(): Selection {
    const ta = ref.current;
    return { start: ta?.selectionStart ?? valueRef.current.length, end: ta?.selectionEnd ?? valueRef.current.length };
  }

  function focusAt(next: Selection) {
    requestAnimationFrame(() => {
      const ta = ref.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(next.start, next.end);
    });
  }

  function apply(result: EditResult, action: "insert" | "template" | "back" | "clear") {
    valueRef.current = result.value;
    onChange(result.value, action);
    focusAt(result.selection);
  }

  function insert(text: string, action: "insert" | "template" = "insert") {
    if (text) apply(insertMath(valueRef.current, selection(), text), action);
  }

  function backspace() {
    const result = backspaceMath(valueRef.current, selection());
    if (result) apply(result, "back");
  }

  function clear() {
    if (valueRef.current) apply({ value: "", selection: { start: 0, end: 0 } }, "clear");
  }

  function nextSlot() {
    const next = nextMathSlot(valueRef.current, selection());
    if (next) focusAt(next);
    return !!next;
  }

  function handleSlotKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab" && nextSlot()) e.preventDefault();
  }

  return { ref, insert, backspace, clear, nextSlot, handleSlotKeyDown };
}

export function MathPreview({ value }: { value: string }) {
  if (!value.trim() || !/(\\[a-zA-Z]+|[=+*/^_∫∑√≤≥∞])/u.test(value)) return null;
  let html: string;
  try {
    html = katex.renderToString(value.replaceAll("□", "\\square "), {
      throwOnError: true, strict: "ignore", output: "html",
    });
  } catch {
    return null; // Free-form prose and partially typed LaTeX are still editable.
  }
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-background px-3 py-2 text-sm"
      aria-label="Math preview">
      <span className="text-xs text-muted-foreground mr-3">Preview</span>
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}