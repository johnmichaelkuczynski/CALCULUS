import { chatJson } from "./ai";

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\u2212\u2010-\u2015]/g, "-")
    .replace(/[$,]/g, "")
    .replace(/[)(\[\]{}]/g, "")
    .replace(/\s*=\s*/g, "=");
}

function asNumber(s: string): number | null {
  const cleaned = s.replace(/[$,%\s]/g, "").replace(/[\u2212]/g, "-");
  if (/^-?\d+(\.\d+)?$/.test(cleaned)) return parseFloat(cleaned);
  const frac = cleaned.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (frac) {
    const n = parseFloat(frac[1]!);
    const d = parseFloat(frac[2]!);
    if (d !== 0) return n / d;
  }
  return null;
}

export async function gradeAnswer(opts: {
  prompt: string;
  correctAnswer: string;
  userAnswer: string;
}): Promise<{ correct: boolean; explanation: string }> {
  const user = opts.userAnswer ?? "";
  const correct = opts.correctAnswer ?? "";

  if (normalize(user) === normalize(correct)) {
    return {
      correct: true,
      explanation: `Correct. ${correct}`,
    };
  }

  const u = asNumber(user);
  const c = asNumber(correct);
  if (u != null && c != null) {
    const tol = Math.max(0.01, Math.abs(c) * 0.01);
    if (Math.abs(u - c) <= tol) {
      return { correct: true, explanation: `Correct. The expected answer is ${correct}.` };
    }
  }

  const out = await chatJson<{ correct: boolean; explanation: string }>(
    "You grade short introductory calculus answers, typically a limit, derivative, integral, series, or application. Accept mathematically equivalent algebraic forms and notation, including equivalent fractions, Greek letters, and subscripts. Output strict JSON {\"correct\": boolean, \"explanation\": string} where explanation is 1-3 short sentences and includes the correct answer.",
    JSON.stringify({
      prompt: opts.prompt,
      correct_answer: correct,
      student_answer: user,
    }),
    undefined,
    (value): value is { correct: boolean; explanation: string } =>
      typeof value === "object" && value !== null &&
      typeof (value as { correct?: unknown }).correct === "boolean" &&
      typeof (value as { explanation?: unknown }).explanation === "string" &&
      Boolean((value as { explanation: string }).explanation.trim()),
  );
  return {
    correct: out.correct,
    explanation: out.explanation,
  };
}
