import { AI_PROVIDERS, getAIProvider, type AIProvider } from "./aiProvider";
import { logger } from "./logger";

// Direct, documented text/chat endpoints. Never route through OpenRouter or GPTZero.
export const TEXT_MODEL = "gpt-4.1";
export const FAST_MODEL = "gpt-4.1-mini";
export const AI_UNAVAILABLE_MESSAGE = "The AI service is temporarily unavailable. Your work is saved; please try again shortly.";

export class AIUnavailableError extends Error {
  readonly retryable = true;
  constructor() {
    super(AI_UNAVAILABLE_MESSAGE);
    this.name = "AIUnavailableError";
  }
}

const configurations: Record<AIProvider, { key: string; model: string; fast: string; url: string }> = {
  perplexity: { key: "PERPLEXITY_API_KEY", model: "sonar", fast: "sonar", url: "https://api.perplexity.ai/chat/completions" },
  openai: { key: "OPENAI_API_KEY", model: "gpt-4.1", fast: "gpt-4.1-mini", url: "https://api.openai.com/v1/chat/completions" },
  deepseek: { key: "DEEPSEEK_API_KEY", model: "deepseek-chat", fast: "deepseek-chat", url: "https://api.deepseek.com/chat/completions" },
  claude: { key: "ANTHROPIC_API_KEY", model: "claude-sonnet-4-5", fast: "claude-haiku-4-5", url: "https://api.anthropic.com/v1/messages" },
  gemini: { key: "GEMINI_API_KEY", model: "gemini-2.5-flash", fast: "gemini-2.5-flash", url: "https://generativelanguage.googleapis.com/v1beta/models" },
  grok: { key: "GROK_API_KEY", model: "grok-3", fast: "grok-3-mini", url: "https://api.x.ai/v1/chat/completions" },
};

const ATTEMPT_MS = 8_000;
const TOTAL_MS = 24_000;

function validText(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Empty AI response");
  return value.trim();
}

export function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function attempt(provider: AIProvider, system: string, user: string, fast: boolean, timeoutMs: number): Promise<string> {
  const config = configurations[provider];
  const key = process.env[config.key];
  if (!key) throw new Error("Provider not configured");
  const model = fast ? config.fast : config.model;
  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const isClaude = provider === "claude";
    const isGemini = provider === "gemini";
    const url = isGemini
      ? `${config.url}/${model}:generateContent`
      : config.url;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isClaude) {
      headers["x-api-key"] = key;
      headers["anthropic-version"] = "2023-06-01";
    } else if (isGemini) {
      headers["x-goog-api-key"] = key;
    } else {
      headers.Authorization = `Bearer ${key}`;
    }
    const body = isClaude
      ? { model, max_tokens: 2048, system, messages: [{ role: "user", content: user }] }
      : isGemini
        ? { system_instruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { maxOutputTokens: 2048 } }
        : { model, max_tokens: 2048, messages: [{ role: "system", content: system }, { role: "user", content: user }] };
    // Race the entire request AND JSON body read: a stalled or misbehaving
    // transport must not prevent the next configured provider being tried.
    const data: unknown = await Promise.race([
      (async () => {
        const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
        if (!response.ok) throw Object.assign(new Error("Provider rejected request"), { status: response.status });
        return response.json();
      })(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error("Provider timed out"));
        }, timeoutMs);
      }),
    ]);
    if (!data || typeof data !== "object") throw new Error("Invalid provider response");
    const obj = data as Record<string, any>;
    if (isClaude) return validText(obj.content?.filter((part: any) => part?.type === "text").map((part: any) => part.text).join(""));
    if (isGemini) return validText(obj.candidates?.[0]?.content?.parts?.filter((part: any) => typeof part?.text === "string").map((part: any) => part.text).join(""));
    return validText(obj.choices?.[0]?.message?.content);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function withFailover<T>(system: string, user: string, model: string, parse: (text: string) => T): Promise<T> {
  const preferred = getAIProvider();
  const providers = [preferred, ...AI_PROVIDERS.filter((provider) => provider !== preferred)]
    .filter((provider) => Boolean(process.env[configurations[provider].key]));
  const deadline = Date.now() + TOTAL_MS;
  for (const [index, provider] of providers.entries()) {
    // Reserve one equal-sized time slice beyond the remaining providers. This
    // avoids consuming the full budget before the last provider gets a turn.
    const remaining = providers.length - index;
    const timeoutMs = Math.max(1, Math.min(ATTEMPT_MS, Math.floor((deadline - Date.now()) / (remaining + 1))));
    try {
      return parse(await attempt(provider, system, user, model === FAST_MODEL, timeoutMs));
    } catch (error) {
      logger.warn({ provider, status: (error as { status?: number })?.status }, "AI provider failed; trying next provider");
    }
  }
  throw new AIUnavailableError();
}

export async function chatText(system: string, user: string, model: string = TEXT_MODEL): Promise<string> {
  return withFailover(system, user, model, validText);
}

export async function chatJson<T = unknown>(
  system: string,
  user: string,
  model: string = TEXT_MODEL,
  validate?: (value: unknown) => value is T,
): Promise<T> {
  return withFailover(system, user, model, (raw) => {
    // Some models return fenced JSON despite explicit instructions.
    const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value) ||
      !Object.keys(value).length || (validate && !validate(value))) {
      throw new Error("Invalid AI JSON shape");
    }
    return value as T;
  });
}