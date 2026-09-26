import type { NextFunction, Request, Response } from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/logger", () => ({ logger: { warn: vi.fn() } }));

import { AIUnavailableError, chatJson, chatText } from "../lib/ai";
import { aiProviderMiddleware, type AIProvider } from "../lib/aiProvider";

const keys = ["PERPLEXITY_API_KEY", "OPENAI_API_KEY", "DEEPSEEK_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GROK_API_KEY"] as const;
const fetchMock = vi.fn();
function response(content: string) {
  return { ok: true, json: async () => ({ choices: [{ message: { content } }] }) };
}
function withPreference<T>(provider: AIProvider, action: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    aiProviderMiddleware(
      { header: () => provider } as unknown as Request,
      {} as Response,
      (() => { void action().then(resolve, reject); }) as NextFunction,
    );
  });
}

describe("direct AI provider failover", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const key of keys) vi.stubEnv(key, "test-key");
    vi.stubEnv("GPTZERO_API_KEY", "detection-only");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(async () => response("A clear answer."));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("sends the selected provider directly first", async () => {
    expect(await withPreference("deepseek", () => chatText("system", "user"))).toBe("A clear answer.");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.deepseek.com/chat/completions");
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).model).toBe("deepseek-chat");
  });
  it("moves to the next independent provider on HTTP failure", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 429 }).mockResolvedValueOnce(response("Recovered"));
    expect(await chatText("system", "user")).toBe("Recovered");
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "https://api.perplexity.ai/chat/completions", "https://api.openai.com/v1/chat/completions",
    ]);
  });
  it("uses native Anthropic and Gemini request/response formats", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true, json: async () => ({ content: [{ type: "text", text: "Claude answer" }] }),
    }).mockResolvedValueOnce({
      ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "Gemini answer" }] } }] }),
    });
    expect(await withPreference("claude", () => chatText("system", "user"))).toBe("Claude answer");
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.anthropic.com/v1/messages");
    expect(fetchMock.mock.calls[0]![1].headers["x-api-key"]).toBe("test-key");
    expect(await withPreference("gemini", () => chatText("system", "user"))).toBe("Gemini answer");
    expect(fetchMock.mock.calls[1]![0]).toContain("gemini-2.5-flash:generateContent");
    expect(fetchMock.mock.calls[1]![1].headers["x-goog-api-key"]).toBe("test-key");
  });
  it("retries invalid JSON and empty responses", async () => {
    fetchMock.mockResolvedValueOnce(response("not json")).mockResolvedValueOnce(response('{"answer":"ok"}'));
    expect(await chatJson("system", "user")).toEqual({ answer: "ok" });
    fetchMock.mockReset().mockResolvedValueOnce(response("  ")).mockResolvedValueOnce(response("recovered"));
    expect(await chatText("system", "user")).toBe("recovered");
  });
  it("rejects wrong JSON shape when a validator is provided", async () => {
    fetchMock.mockResolvedValueOnce(response('{"wrong":"shape"}')).mockResolvedValueOnce(response('{"answer":"ok"}'));
    const result = await chatJson<{ answer: string }>("system", "user", undefined,
      (value): value is { answer: string } => typeof (value as { answer?: unknown }).answer === "string");
    expect(result.answer).toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("returns retryable service state when all providers fail", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(chatText("system", "user")).rejects.toBeInstanceOf(AIUnavailableError);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });
  it("times out stalled providers and still attempts all six within the total budget", async () => {
    vi.useFakeTimers();
    // Simulates a transport which ignores abort signals entirely.
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const started = Date.now();
    const result = chatText("system", "user");
    const assertion = expect(result).rejects.toBeInstanceOf(AIUnavailableError);
    await vi.advanceTimersByTimeAsync(24_000);
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(Date.now() - started).toBeLessThanOrEqual(24_000);
  });
  it("never uses GPTZero as a generative provider", async () => {
    for (const key of keys) vi.stubEnv(key, "");
    await expect(chatText("system", "user")).rejects.toBeInstanceOf(AIUnavailableError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});