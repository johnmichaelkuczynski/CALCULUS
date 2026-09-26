import { useState, useEffect } from "react";
import { Delete } from "lucide-react";
import { CALCULUS_TEMPLATES } from "@/components/mathEditing";
import "katex/dist/katex.min.css";

type SymbolKey = string | { label: string; insert: string; action?: "back" | "clear"; wide?: boolean; muted?: boolean };

const NUMBER_PAD: SymbolKey[] = [
  "7", "8", "9", { label: "÷", insert: "/" }, { label: "⌫", insert: "", action: "back", muted: true },
  "4", "5", "6", { label: "×", insert: "*" }, { label: "C", insert: "", action: "clear", muted: true },
  "1", "2", "3", { label: "−", insert: "-" }, "(",
  "0", ".", ",", "+", ")",
  "%", "=", { label: "space", insert: " ", wide: true },
];

const KEYBOARDS: Record<string, SymbolKey[]> = {
  Numbers: NUMBER_PAD,
  Algebra: [
    "=", "≠", "≈", "≡", "<", ">", "≤", "≥", "∝",
    "x", "y", "z", "a", "b", "c", "n",
    "+", "-", "·", "÷", "±", "√", "∛", "^2", "^3", "^n", "|x|", "!",
  ],
  Calculus: [
    "∫", "∬", "∭", "∮", "d/dx", "∂/∂x", "lim", "→", "∞",
    "Δ", "∇", "dx", "dy", "dz", "dt", "e", "ln", "log"
  ],
  Trigonometry: [
    "sin", "cos", "tan", "csc", "sec", "cot", "arcsin", "arccos", "arctan",
    "θ", "α", "β", "γ", "φ", "π", "°", "rad"
  ],
  Geometry: [
    "△", "∠", "⊥", "∥", "≅", "∼", "π", "r", "d", "A", "V", "C"
  ],
  Statistics: [
    "μ", "σ", "σ²", "s", "s²", "x̄", "p̂", "P(A)", "P(A|B)",
    "∑", "∏", "E(X)", "Var(X)", "N(μ,σ²)", "z", "t", "χ²", "F"
  ],
};

type KeyboardKey = keyof typeof KEYBOARDS;

interface MathKeyboardProps {
  onInsert: (symbol: string) => void;
  onBackspace?: () => void;
  onClear?: () => void;
  onTemplate?: (template: string) => void;
  onNextSlot?: () => void;
}

export function MathKeyboard({ onInsert, onBackspace, onClear, onTemplate, onNextSlot }: MathKeyboardProps) {
  const [activeTab, setActiveTab] = useState<KeyboardKey>(() => {
    const saved = localStorage.getItem("math-keyboard-tab-v3");
    if (saved && saved in KEYBOARDS) return saved as KeyboardKey;
    return "Calculus";
  });

  useEffect(() => {
    localStorage.setItem("math-keyboard-tab-v3", activeTab);
  }, [activeTab]);

  const activeTabs: KeyboardKey[] = [activeTab];
  const toggleTab = (tab: KeyboardKey) => setActiveTab(tab);

  const handleKey = (key: SymbolKey) => {
    if (typeof key === "string") {
      onInsert(key);
      return;
    }
    if (key.action === "back") {
      onBackspace ? onBackspace() : onInsert("");
      return;
    }
    if (key.action === "clear") {
      onClear ? onClear() : onInsert("");
      return;
    }
    onInsert(key.insert);
  };

  return (
    <div className="bg-secondary/50 border rounded-md p-3 flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
          Calculus templates · type in the selected □, then Next slot
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CALCULUS_TEMPLATES.map(({ label, insert }) => (
            <button key={label} type="button" onClick={() => (onTemplate ?? onInsert)(insert)}
              aria-label={`Insert ${label} template`}
              className="shrink-0 min-h-10 px-3 rounded border bg-background text-sm hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              data-testid={`mathkb-template-${label}`}>
              {label}
            </button>
          ))}
          <button type="button" onClick={onNextSlot} disabled={!onNextSlot}
            className="shrink-0 min-h-10 px-3 rounded border border-primary/40 bg-primary/10 text-sm disabled:opacity-50"
            data-testid="mathkb-next-slot">Next slot →</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {(Object.keys(KEYBOARDS) as KeyboardKey[]).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => toggleTab(tab)}
            aria-pressed={activeTab === tab}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted border border-border"
            }`}
            data-testid={`mathkb-tab-${tab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {activeTabs.map(tab => {
          if (!KEYBOARDS[tab]) return null;
          const isNumbers = tab === "Numbers";
          return (
            <div key={tab} className="flex flex-col gap-1.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-1">
                {tab}
              </div>
              <div className={isNumbers ? "grid grid-cols-5 gap-1.5" : "flex flex-wrap gap-1.5"}>
                {KEYBOARDS[tab].map((key, i) => {
                  const isObj = typeof key !== "string";
                  const label = isObj ? key.label : key;
                  const muted = isObj && key.muted;
                  const wide = isObj && key.wide;
                  return (
                    <button
                      key={`${tab}-${i}-${label}`}
                      type="button"
                      onClick={() => handleKey(key)}
                      aria-label={isObj && key.action === "back" ? "Backspace" : isObj && key.action === "clear" ? "Clear answer" : label}
                      className={`min-w-9 h-10 px-2 rounded border shadow-sm flex items-center justify-center font-mono text-sm hover:bg-muted hover:border-primary/50 transition-all active:scale-95 ${
                        muted ? "bg-muted/40 text-muted-foreground" : "bg-background"
                      } ${wide ? "col-span-3 text-xs" : ""}`}
                      data-testid={`mathkb-key-${tab}-${label}`}
                    >
                      {isObj && key.action === "back" ? <Delete className="w-4 h-4" /> : label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
