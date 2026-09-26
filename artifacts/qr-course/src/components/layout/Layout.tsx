import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, PenTool, BarChart3, Activity, RotateCcw, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { CompanyContact } from "@/components/CompanyContact";
import { customFetch, setAiProviderGetter } from "@workspace/api-client-react";

const AI_PROVIDERS = [
  { value: "gemini", label: "Gemini" },
  { value: "perplexity", label: "Perplexity" },
  { value: "openai", label: "OpenAI" },
  { value: "claude", label: "Claude / Anthropic" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "grok", label: "Grok" },
] as const;

export function Sidebar() {
  const [location] = useLocation();
  const [provider, setProvider] = useState(() => {
    const saved = localStorage.getItem("calculus-ai-provider") ?? localStorage.getItem("economics101-ai-provider");
    return AI_PROVIDERS.some((item) => item.value === saved) ? saved! : "perplexity";
  });

  useEffect(() => {
    localStorage.setItem("calculus-ai-provider", provider);
    setAiProviderGetter(() => provider);
  }, [provider]);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assignments", label: "Assignments", icon: PenTool },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="w-64 border-r bg-sidebar flex flex-col h-full h-screen sticky top-0">
      <div className="p-6 border-b border-border">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-serif font-bold text-lg">
              ∑
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight">Calculus</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-2 px-4">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>LLM provider</span>
          <select
            aria-label="LLM provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            data-testid="select-ai-provider"
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs normal-case tracking-normal text-foreground"
          >
            {AI_PROVIDERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <div className="flex justify-center text-muted-foreground">
          <CompanyContact compact />
        </div>
      </div>
    </div>
  );
}

function TopBar() {
  const [location, setLocation] = useLocation();
  const active = location.startsWith("/diagnostics");
  const qc = useQueryClient();
  const [resetting, setResetting] = useState(false);
  const [expanding, setExpanding] = useState(false);

  async function handleExpandLectures() {
    if (
      !confirm(
         "Generate Medium and Long versions of every lecture? This runs the tutor over all 29 lectures twice (medium, then long). Takes a few minutes.",
      )
    )
      return;
    setExpanding(true);
    try {
       const mData = await customFetch<{ updated?: number; failed?: number; total?: number }>("/api/diagnostics/expand-lectures?level=medium", { method: "POST", responseType: "json" });
       const lRes = await customFetch<{ updated?: number; failed?: number; total?: number }>("/api/diagnostics/expand-lectures?level=long", { method: "POST", responseType: "json" });
       const lData = lRes;
      await qc.invalidateQueries();
      alert(
        `Medium: ${mData.updated ?? 0}/${mData.total ?? 0} (${mData.failed ?? 0} failed)\n` +
          `Long:   ${lData.updated ?? 0}/${lData.total ?? 0} (${lData.failed ?? 0} failed)`,
      );
    } catch {
      alert("Couldn't generate the longer lectures right now. Please try again later; your existing lectures are unchanged.");
    } finally {
      setExpanding(false);
    }
  }

  async function handleReset() {
    if (
      !confirm(
        "Reset your course? This deletes your assignment attempts, answers, and practice sessions, but keeps lectures and assignments.",
      )
    )
      return;
    setResetting(true);
    try {
       await customFetch<unknown>("/api/diagnostics/reset", { method: "POST" });
      await qc.invalidateQueries();
      setLocation("/");
    } catch {
      alert("Couldn't reset the course right now. Your saved work is still here; please try again.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="sticky top-0 z-10 flex items-center justify-end gap-2 px-6 py-3 border-b border-border bg-background/80 backdrop-blur">
      <button
        onClick={handleExpandLectures}
        disabled={expanding}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border border-border hover:bg-secondary disabled:opacity-50"
        data-testid="button-expand-lectures"
        title="Rewrite every lecture with worked examples after each point"
      >
        <Sparkles className={`w-4 h-4 ${expanding ? "animate-pulse" : ""}`} />
        {expanding ? "Rewriting…" : "Generate medium + long lectures"}
      </button>
      <button
        onClick={handleReset}
        disabled={resetting}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border border-border hover:bg-secondary disabled:opacity-50"
        data-testid="button-reset"
        title="Wipe your progress (keeps lectures and assignments)"
      >
        <RotateCcw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
        {resetting ? "Resetting…" : "Reset course"}
      </button>
      <Link href="/diagnostics">
        <button
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active
              ? "bg-primary text-primary-foreground"
              : "border border-border hover:bg-secondary"
          }`}
          data-testid="button-diagnostic"
        >
          <Activity className="w-4 h-4" />
          Diagnostic
        </button>
      </Link>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <TopBar />
        {children}
      </main>
    </div>
  );
}
