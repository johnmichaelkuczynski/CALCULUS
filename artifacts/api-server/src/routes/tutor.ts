import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, lecturesTable } from "@workspace/db";
import { AskTutorBody, AskTutorResponse } from "@workspace/api-zod";
import { chatText, chatJson, FAST_MODEL } from "../lib/ai";
import { AI_UNAVAILABLE_MESSAGE } from "../lib/ai";

const router: IRouter = Router();

router.get("/tutor/suggestions/:lectureId", async (req, res): Promise<void> => {
  const lectureId = Number(req.params.lectureId);
  if (!Number.isFinite(lectureId)) {
    res.status(400).json({ error: "invalid lectureId" });
    return;
  }
  const [lecture] = await db
    .select()
    .from(lecturesTable)
    .where(eq(lecturesTable.id, lectureId));
  if (!lecture) {
    res.status(404).json({ error: "lecture not found" });
    return;
  }

  try {
    const out = await chatJson<{ questions: string[] }>(
      'You are an encouraging college calculus tutor. Reply as strict JSON of the form {"questions": string[]} with NO other keys.',
      `From the lecture below, generate 6 short, concrete starter questions a student might want to ask after reading it. Cover every major idea in the reading (not just the first one). Each question must be one sentence, under ~18 words, in the student's voice (e.g. "Why does ...?", "Can you show me ...?", "What's the difference between ...?").\n\nMATH NOTATION RULES (strict):\n- ANY math symbol, variable, formula, or expression — including simple ones like $E$, $mc^2$, $\\pi$, $x^2$, $\\Delta S \\ge 0$ — MUST be wrapped in $...$ (LaTeX inline math).\n- NEVER write raw exponents like mc^2, x^2, or H_2O. ALWAYS wrap: $mc^2$, $x^2$, $H_2O$.\n- Greek letters and special symbols (\\pi, \\sigma, \\Delta, \\equiv, \\approx, \\sum, \\int, \\to, \\forall, \\in, \\mathbb{R}, ...) MUST be inside $...$.\n- Plain English words ("identity", "limit", "set") stay outside the math delimiters.\n\nLECTURE TITLE: ${lecture.title}\n\nLECTURE BODY:\n"""\n${lecture.body}\n"""`,
      FAST_MODEL,
      (value): value is { questions: string[] } => typeof value === "object" && value !== null && Array.isArray((value as { questions?: unknown }).questions) && (value as { questions: unknown[] }).questions.some((q) => typeof q === "string" && q.trim().length > 0),
    );
    const questions = Array.isArray(out?.questions)
      ? out.questions.filter((q) => typeof q === "string" && q.trim().length > 0).slice(0, 8)
      : [];
    res.json({ questions });
  } catch {
    res.status(503).json({ error: AI_UNAVAILABLE_MESSAGE, retryable: true });
  }
});

router.post("/tutor/ask", async (req, res): Promise<void> => {
  const parsed = AskTutorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { message, selectedLectureText } = parsed.data;

  const sys =
    "You are an encouraging college calculus tutor (limits, derivatives, integrals, series, and applications). Explain step by step, prefer concrete numbers and worked calculus examples, and write inline math as $...$ (LaTeX). Keep replies short (3-6 sentences) unless the student asks for more detail. By default, guide rather than hand over the answer — BUT if the student explicitly asks for a direct answer, give the complete, correct answer plainly.";
  const user = selectedLectureText
    ? `Context from the lecture the student is reading:\n"""\n${selectedLectureText}\n"""\n\nStudent question: ${message}`
    : message;

  try {
    const text = await chatText(sys, user);
    res.json(AskTutorResponse.parse({ text, audioUrl: null }));
  } catch {
    res.status(503).json({ error: AI_UNAVAILABLE_MESSAGE, retryable: true });
  }
});

export default router;
