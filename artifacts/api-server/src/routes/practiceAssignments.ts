import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  db,
  assignmentsTable,
  problemsTable,
  topicsTable,
  practiceAssignmentsTable,
  practiceAssignmentProblemsTable,
  practiceAssignmentAnswersTable,
  feedbackMessagesTable,
} from "@workspace/db";
import {
  GeneratePracticeAssignmentBody,
  GeneratePracticeAssignmentResponse,
  GetPracticeAssignmentResponse,
  ListPracticeAssignmentsResponseItem,
  SavePracticeAssignmentAnswerBody,
  SubmitPracticeAssignmentResponse,
  PostFeedbackMessageBody,
  PostFeedbackMessageResponse,
  GetFeedbackMessagesResponseItem,
} from "@workspace/api-zod";
import { chatJson, AI_UNAVAILABLE_MESSAGE, nonEmptyString } from "../lib/ai";
import { gradeAnswer } from "../lib/grading";
import { getUserId } from "../lib/userId";
import { recordTopicResult, logActivity } from "../lib/profile";

const router: IRouter = Router();

function parseIdParam(raw: unknown): number {
  const s = Array.isArray(raw) ? raw[0] : (raw as string);
  return parseInt(s ?? "", 10);
}

// Collapses a prompt to a comparable key so we can deterministically reject any
// generated problem that duplicates a graded or prior-practice prompt.
function normalizePrompt(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9$+\-=/^().]/g, "")
    .trim();
}

type GeneratedProblem = {
  topicSlug: string;
  prompt: string;
  correctAnswer: string;
  explanation: string;
  hint?: string;
};

// Builds a fresh practice version of a graded assignment. The generator is
// given the real graded prompts (to NEVER reproduce) and the user's prior
// practice prompts for this assignment (to avoid repeats), while mirroring the
// source's kind, topic mix, and problem count.
async function generateProblems(opts: {
  sourceTitle: string;
  kind: string;
  weekNumber: number;
  topics: Array<{ slug: string; title: string }>;
  gradedPrompts: string[];
  priorPrompts: string[];
  count: number;
}): Promise<GeneratedProblem[]> {
  const system = [
    "You are a calculus professor authoring a FRESH practice version of a graded assignment for an introductory college calculus course.",
    "Produce brand-new problems that test the SAME concepts and difficulty as the graded set, but are clearly different problems (different numbers, scenarios, framing).",
    "CRITICAL RULES:",
    "1. NEVER reproduce, paraphrase, or trivially re-number any of the graded problems provided. They must not overlap.",
    "2. NEVER repeat any of the prior practice problems provided.",
    "3. Each problem must belong to exactly one of the allowed topics (use its slug).",
    "4. Like the graded set, the canonical answer should be a short calculus expression or number. Keep correctAnswer short, never multi-paragraph.",
    "5. Use $...$ for inline LaTeX in prompts/explanations where helpful.",
    "6. Provide a one-line hint that nudges without giving the answer away.",
    'Respond as strict JSON: {"problems": [{"topicSlug": string, "prompt": string, "correctAnswer": string, "explanation": string, "hint": string}]}.',
  ].join("\n");

  const user = JSON.stringify({
    assignment: opts.sourceTitle,
    kind: opts.kind,
    weekNumber: opts.weekNumber,
    problemCount: opts.count,
    allowedTopics: opts.topics,
    gradedProblemsDoNotReproduce: opts.gradedPrompts,
    priorPracticeProblemsDoNotRepeat: opts.priorPrompts,
  });

  const out = await chatJson<{ problems: GeneratedProblem[] }>(system, user, undefined,
    (value): value is { problems: GeneratedProblem[] } => {
      const problems = (value as { problems?: unknown })?.problems;
      return Array.isArray(problems) && problems.length >= opts.count && problems.every((p) =>
        p && typeof p === "object" && ["topicSlug", "prompt", "correctAnswer", "explanation"].every((key) =>
          typeof p[key] === "string" && p[key].trim()) && opts.topics.some((topic) => topic.slug === p.topicSlug));
    });
  const problems = Array.isArray(out.problems) ? out.problems : [];
  return problems.slice(0, opts.count);
}

// POST /practice-assignments — generate a fresh practice version.
router.post("/practice-assignments", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const parsed = GeneratePracticeAssignmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { sourceAssignmentId } = parsed.data;

  const [source] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, sourceAssignmentId));
  if (!source) {
    res.status(404).json({ error: "assignment not found" });
    return;
  }

  // The graded problems (with their topics) define the blueprint.
  const gradedProblems = await db
    .select({
      prompt: problemsTable.prompt,
      topicId: problemsTable.topicId,
      topicSlug: topicsTable.slug,
      topicTitle: topicsTable.title,
    })
    .from(problemsTable)
    .leftJoin(topicsTable, eq(problemsTable.topicId, topicsTable.id))
    .where(eq(problemsTable.assignmentId, sourceAssignmentId))
    .orderBy(asc(problemsTable.position));

  if (gradedProblems.length === 0) {
    res.status(400).json({ error: "source assignment has no problems" });
    return;
  }

  const topicMap = new Map<string, { slug: string; title: string }>();
  for (const g of gradedProblems) {
    if (g.topicSlug) topicMap.set(g.topicSlug, { slug: g.topicSlug, title: g.topicTitle ?? g.topicSlug });
  }

  // Prior practice prompts for this user+source. We fetch ALL of them for the
  // deterministic exclusion set; only the most recent are sent to the LLM as a
  // hint to keep the request bounded.
  const priorRows = await db
    .select({ prompt: practiceAssignmentProblemsTable.prompt })
    .from(practiceAssignmentProblemsTable)
    .innerJoin(
      practiceAssignmentsTable,
      eq(practiceAssignmentProblemsTable.practiceAssignmentId, practiceAssignmentsTable.id),
    )
    .where(
      and(
        eq(practiceAssignmentsTable.userId, userId),
        eq(practiceAssignmentsTable.sourceAssignmentId, sourceAssignmentId),
      ),
    )
    .orderBy(desc(practiceAssignmentProblemsTable.id));

  // Deterministic no-overlap guarantee: any generated problem whose normalized
  // prompt collides with a graded prompt, a prior practice prompt, or another
  // problem in this same batch is rejected — we never trust the LLM alone.
  const gradedPromptList = gradedProblems.map((g) => g.prompt);
  const priorPromptList = priorRows.map((p) => p.prompt);
  const seenKeys = new Set<string>(
    [...gradedPromptList, ...priorPromptList].map(normalizePrompt).filter(Boolean),
  );

  // Resolve topic ids for storing problems.
  const allTopics = await db.select().from(topicsTable);
  const slugToId = new Map(allTopics.map((t) => [t.slug, { id: t.id, title: t.title }]));

  let llmProblems: GeneratedProblem[] = [];
  try {
    llmProblems = await generateProblems({
      sourceTitle: source.title,
      kind: source.kind,
      weekNumber: source.weekNumber,
      topics: Array.from(topicMap.values()),
      gradedPrompts: gradedPromptList,
      priorPrompts: priorPromptList.slice(0, 40),
      count: gradedProblems.length,
    });
  } catch (err) {
    req.log.warn({ err }, "practice generation unavailable");
    res.status(503).json({ error: AI_UNAVAILABLE_MESSAGE, retryable: true });
    return;
  }

  // Keep only genuinely fresh problems.
  const generated: GeneratedProblem[] = [];
  for (const gp of llmProblems) {
    const key = normalizePrompt(gp.prompt);
    if (!key || seenKeys.has(key)) continue;
    seenKeys.add(key);
    generated.push(gp);
  }

  if (generated.length < gradedProblems.length) {
    res.status(503).json({ error: "Unable to generate a complete nonoverlapping practice set. Your work is saved; please try again.", retryable: true });
    return;
  }

  const [created] = await db
    .insert(practiceAssignmentsTable)
    .values({
      userId,
      sourceAssignmentId,
      kind: source.kind,
      title: `Practice — ${source.title}`,
      weekNumber: source.weekNumber,
      status: "in_progress",
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "failed to create" });
    return;
  }

  const fallbackTopicId = gradedProblems[0]!.topicId;
  let position = 1;
  for (const gp of generated) {
    const resolved = slugToId.get(gp.topicSlug);
    const topicId = resolved?.id ?? fallbackTopicId;
    await db.insert(practiceAssignmentProblemsTable).values({
      practiceAssignmentId: created.id,
      topicId,
      position: position++,
      prompt: gp.prompt,
      correctAnswer: gp.correctAnswer,
      explanation: gp.explanation,
      hint: gp.hint ?? null,
      difficulty: 3.0,
    });
  }

  await logActivity({
    userId,
    kind: "practice_generated",
    refId: created.id,
    detail: source.title,
  });

  const detail = await loadDetail(created.id, userId);
  if (!detail) {
    res.status(500).json({ error: "failed to load" });
    return;
  }
  res.json(GeneratePracticeAssignmentResponse.parse(detail));
});

async function loadDetail(id: number, userId: string) {
  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(
      and(eq(practiceAssignmentsTable.id, id), eq(practiceAssignmentsTable.userId, userId)),
    );
  if (!pa) return null;

  const [source] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, pa.sourceAssignmentId));

  const problems = await db
    .select({
      id: practiceAssignmentProblemsTable.id,
      position: practiceAssignmentProblemsTable.position,
      prompt: practiceAssignmentProblemsTable.prompt,
      topicId: practiceAssignmentProblemsTable.topicId,
      topicTitle: topicsTable.title,
      hint: practiceAssignmentProblemsTable.hint,
      difficulty: practiceAssignmentProblemsTable.difficulty,
      correctAnswer: practiceAssignmentProblemsTable.correctAnswer,
      explanation: practiceAssignmentProblemsTable.explanation,
    })
    .from(practiceAssignmentProblemsTable)
    .leftJoin(topicsTable, eq(practiceAssignmentProblemsTable.topicId, topicsTable.id))
    .where(eq(practiceAssignmentProblemsTable.practiceAssignmentId, id))
    .orderBy(asc(practiceAssignmentProblemsTable.position));

  const answers = await db
    .select()
    .from(practiceAssignmentAnswersTable)
    .where(eq(practiceAssignmentAnswersTable.practiceAssignmentId, id));
  const byProblem = new Map(answers.map((a) => [a.problemId, a]));

  const submitted = pa.status === "submitted";

  return {
    id: pa.id,
    sourceAssignmentId: pa.sourceAssignmentId,
    kind: pa.kind as "homework" | "test" | "midterm" | "final",
    title: pa.title,
    weekNumber: pa.weekNumber,
    status: pa.status as "in_progress" | "submitted",
    scorePercent: pa.scorePercent,
    instructions: source?.instructions ?? null,
    problems: problems.map((p) => ({
      id: p.id,
      position: p.position,
      prompt: p.prompt,
      topicId: p.topicId,
      topicTitle: p.topicTitle ?? null,
      hint: p.hint ?? null,
      difficulty: p.difficulty,
    })),
    answers: problems.map((p) => {
      const a = byProblem.get(p.id);
      return {
        problemId: p.id,
        answer: a?.answer ?? "",
        correct: a?.correct ?? null,
        score: a?.score ?? null,
        feedback: a?.feedback ?? null,
        whatWasRight: a?.whatWasRight ?? null,
        whatToFix: a?.whatToFix ?? null,
        conceptTip: a?.conceptTip ?? null,
        // Only reveal canonical answer/explanation after submission.
        correctAnswer: submitted ? p.correctAnswer : null,
        explanation: submitted ? p.explanation : null,
      };
    }),
  };
}

// GET /practice-assignments?sourceAssignmentId=
router.get("/practice-assignments", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const sourceRaw = req.query.sourceAssignmentId;
  const sourceId = sourceRaw != null ? parseInt(String(sourceRaw), 10) : null;

  const where =
    sourceId != null && Number.isFinite(sourceId)
      ? and(
          eq(practiceAssignmentsTable.userId, userId),
          eq(practiceAssignmentsTable.sourceAssignmentId, sourceId),
        )
      : eq(practiceAssignmentsTable.userId, userId);

  const rows = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(where)
    .orderBy(desc(practiceAssignmentsTable.id));

  const result = await Promise.all(
    rows.map(async (r) => {
      const cnt = await db
        .select({ id: practiceAssignmentProblemsTable.id })
        .from(practiceAssignmentProblemsTable)
        .where(eq(practiceAssignmentProblemsTable.practiceAssignmentId, r.id));
      return {
        id: r.id,
        sourceAssignmentId: r.sourceAssignmentId,
        kind: r.kind as "homework" | "test" | "midterm" | "final",
        title: r.title,
        weekNumber: r.weekNumber,
        status: r.status as "in_progress" | "submitted",
        scorePercent: r.scorePercent,
        problemCount: cnt.length,
        createdAt: r.startedAt.toISOString(),
      };
    }),
  );
  res.json(result.map((r) => ListPracticeAssignmentsResponseItem.parse(r)));
});

// GET /practice-assignments/:id
router.get("/practice-assignments/:id", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = parseIdParam(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const detail = await loadDetail(id, userId);
  if (!detail) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(GetPracticeAssignmentResponse.parse(detail));
});

// PUT /practice-assignments/:id/answer
router.put("/practice-assignments/:id/answer", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = parseIdParam(req.params.id);
  const parsed = SavePracticeAssignmentAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(
      and(eq(practiceAssignmentsTable.id, id), eq(practiceAssignmentsTable.userId, userId)),
    );
  if (!pa) {
    res.status(404).json({ error: "not found" });
    return;
  }
  if (pa.status !== "in_progress") {
    res.status(400).json({ error: "already submitted" });
    return;
  }
  const { problemId, answer } = parsed.data;
  const [problem] = await db
    .select()
    .from(practiceAssignmentProblemsTable)
    .where(
      and(
        eq(practiceAssignmentProblemsTable.id, problemId),
        eq(practiceAssignmentProblemsTable.practiceAssignmentId, id),
      ),
    );
  if (!problem) {
    res.status(404).json({ error: "problem not found" });
    return;
  }
  const [existing] = await db
    .select()
    .from(practiceAssignmentAnswersTable)
    .where(
      and(
        eq(practiceAssignmentAnswersTable.practiceAssignmentId, id),
        eq(practiceAssignmentAnswersTable.problemId, problemId),
      ),
    );
  if (existing) {
    await db
      .update(practiceAssignmentAnswersTable)
      .set({ answer, updatedAt: new Date() })
      .where(eq(practiceAssignmentAnswersTable.id, existing.id));
  } else {
    await db.insert(practiceAssignmentAnswersTable).values({
      practiceAssignmentId: id,
      problemId,
      answer,
    });
  }
  res.json({ ok: true });
});

type RichFeedback = {
  whatWasRight: string;
  whatToFix: string;
  conceptTip: string;
  feedback: string;
};

async function richFeedbackFor(opts: {
  prompt: string;
  correctAnswer: string;
  userAnswer: string;
  correct: boolean;
  explanation: string;
  topicTitle: string;
}): Promise<RichFeedback> {
  try {
    const out = await chatJson<RichFeedback>(
      [
        "You are an encouraging, surgically precise calculus tutor giving feedback on ONE practice problem.",
        "Be specific to THIS student's answer — quote what they wrote, name the exact step that went right or wrong, and tie it to the underlying concept.",
        "Use $...$ for inline LaTeX. Keep each field tight and concrete (no fluff).",
        'Respond as strict JSON: {"whatWasRight": string, "whatToFix": string, "conceptTip": string, "feedback": string} where "feedback" is a 2-4 sentence markdown paragraph that ties it together and motivates the next attempt.',
      ].join("\n"),
      JSON.stringify({
        topic: opts.topicTitle,
        prompt: opts.prompt,
        correctAnswer: opts.correctAnswer,
        studentAnswer: opts.userAnswer,
        wasMarkedCorrect: opts.correct,
        canonicalExplanation: opts.explanation,
      }),
      undefined,
      (value): value is RichFeedback =>
        nonEmptyString((value as { feedback?: unknown }).feedback) &&
        ["whatWasRight", "whatToFix", "conceptTip"].every((key) =>
          typeof (value as Record<string, unknown>)[key] === "string"),
    );
    return {
      whatWasRight: out.whatWasRight || (opts.correct ? "You reached a correct result." : ""),
      whatToFix: out.whatToFix || (opts.correct ? "" : "Revisit the formula structure."),
      conceptTip: out.conceptTip || "",
      feedback: out.feedback || opts.explanation,
    };
  } catch {
    return {
      whatWasRight: opts.correct ? "You reached a correct result." : "",
      whatToFix: opts.correct ? "" : "Check the formula structure against the explanation.",
      conceptTip: "",
      feedback: opts.explanation,
    };
  }
}

// Reconstructs the submit result from already-graded, stored answers — used to
// make re-submission idempotent without re-grading or re-logging.
async function loadSubmittedResult(id: number) {
  const problems = await db
    .select({
      id: practiceAssignmentProblemsTable.id,
      correctAnswer: practiceAssignmentProblemsTable.correctAnswer,
      explanation: practiceAssignmentProblemsTable.explanation,
      topicId: practiceAssignmentProblemsTable.topicId,
      topicTitle: topicsTable.title,
    })
    .from(practiceAssignmentProblemsTable)
    .leftJoin(topicsTable, eq(practiceAssignmentProblemsTable.topicId, topicsTable.id))
    .where(eq(practiceAssignmentProblemsTable.practiceAssignmentId, id))
    .orderBy(asc(practiceAssignmentProblemsTable.position));

  const answers = await db
    .select()
    .from(practiceAssignmentAnswersTable)
    .where(eq(practiceAssignmentAnswersTable.practiceAssignmentId, id));
  const byProblem = new Map(answers.map((a) => [a.problemId, a]));

  let score = 0;
  const perProblem = problems.map((p) => {
    const a = byProblem.get(p.id);
    if (a?.correct) score += 1;
    return {
      problemId: p.id,
      correct: a?.correct ?? false,
      score: a?.score ?? 0,
      userAnswer: a?.answer ?? "",
      correctAnswer: p.correctAnswer,
      explanation: p.explanation,
      feedback: a?.feedback ?? "",
      whatWasRight: a?.whatWasRight ?? null,
      whatToFix: a?.whatToFix ?? null,
      conceptTip: a?.conceptTip ?? null,
      topicId: p.topicId,
      topicTitle: p.topicTitle ?? null,
    };
  });

  const total = problems.length;
  return {
    id,
    score,
    total,
    percent: total === 0 ? 0 : (score / total) * 100,
    overallFeedback: null as string | null,
    perProblem,
  };
}

// POST /practice-assignments/:id/submit
router.post("/practice-assignments/:id/submit", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = parseIdParam(req.params.id);
  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(
      and(eq(practiceAssignmentsTable.id, id), eq(practiceAssignmentsTable.userId, userId)),
    );
  if (!pa) {
    res.status(404).json({ error: "not found" });
    return;
  }

  // Idempotent: never re-grade an already-submitted set. Re-grading would
  // re-run recordTopicResult + logActivity and inflate the per-user profile and
  // readiness signals. Return the stored result instead.
  if (pa.status !== "in_progress") {
    res.json(SubmitPracticeAssignmentResponse.parse(await loadSubmittedResult(id)));
    return;
  }

  const problems = await db
    .select({
      id: practiceAssignmentProblemsTable.id,
      prompt: practiceAssignmentProblemsTable.prompt,
      correctAnswer: practiceAssignmentProblemsTable.correctAnswer,
      explanation: practiceAssignmentProblemsTable.explanation,
      topicId: practiceAssignmentProblemsTable.topicId,
      topicTitle: topicsTable.title,
    })
    .from(practiceAssignmentProblemsTable)
    .leftJoin(topicsTable, eq(practiceAssignmentProblemsTable.topicId, topicsTable.id))
    .where(eq(practiceAssignmentProblemsTable.practiceAssignmentId, id))
    .orderBy(asc(practiceAssignmentProblemsTable.position));

  const answers = await db
    .select()
    .from(practiceAssignmentAnswersTable)
    .where(eq(practiceAssignmentAnswersTable.practiceAssignmentId, id));
  const byProblem = new Map(answers.map((a) => [a.problemId, a]));

  const perProblem = [];
  let score = 0;
  for (const p of problems) {
    const a = byProblem.get(p.id);
    const userAnswer = a?.answer ?? "";
    const graded = await gradeAnswer({
      prompt: p.prompt,
      correctAnswer: p.correctAnswer,
      userAnswer,
    });
    const numericScore = graded.correct ? 1 : 0;
    if (graded.correct) score += 1;

    const rich = await richFeedbackFor({
      prompt: p.prompt,
      correctAnswer: p.correctAnswer,
      userAnswer,
      correct: graded.correct,
      explanation: graded.explanation || p.explanation,
      topicTitle: p.topicTitle ?? "calculus",
    });

    // Persist the answer row with feedback (create if missing).
    if (a) {
      await db
        .update(practiceAssignmentAnswersTable)
        .set({
          correct: graded.correct,
          score: numericScore,
          feedback: rich.feedback,
          whatWasRight: rich.whatWasRight,
          whatToFix: rich.whatToFix,
          conceptTip: rich.conceptTip,
          gradedAt: new Date(),
        })
        .where(eq(practiceAssignmentAnswersTable.id, a.id));
    } else {
      await db.insert(practiceAssignmentAnswersTable).values({
        practiceAssignmentId: id,
        problemId: p.id,
        answer: userAnswer,
        correct: graded.correct,
        score: numericScore,
        feedback: rich.feedback,
        whatWasRight: rich.whatWasRight,
        whatToFix: rich.whatToFix,
        conceptTip: rich.conceptTip,
        gradedAt: new Date(),
      });
    }

    // Update the evolving per-topic profile + activity log.
    await recordTopicResult({
      userId,
      topicId: p.topicId,
      correct: graded.correct,
      score: numericScore,
    });
    await logActivity({
      userId,
      kind: "practice_problem_graded",
      refId: id,
      topicId: p.topicId,
      score: numericScore,
    });

    perProblem.push({
      problemId: p.id,
      correct: graded.correct,
      score: numericScore,
      userAnswer,
      correctAnswer: p.correctAnswer,
      explanation: graded.explanation || p.explanation,
      feedback: rich.feedback,
      whatWasRight: rich.whatWasRight || null,
      whatToFix: rich.whatToFix || null,
      conceptTip: rich.conceptTip || null,
      topicId: p.topicId,
      topicTitle: p.topicTitle ?? null,
    });
  }

  const total = problems.length;
  const percent = total === 0 ? 0 : (score / total) * 100;
  await db
    .update(practiceAssignmentsTable)
    .set({ status: "submitted", submittedAt: new Date(), scorePercent: percent })
    .where(eq(practiceAssignmentsTable.id, id));

  await logActivity({
    userId,
    kind: "practice_submitted",
    refId: id,
    score: percent / 100,
    detail: pa.title,
  });

  let overallFeedback: string | null = null;
  try {
    const out = await chatJson<{ summary: string }>(
      "You are a motivating calculus tutor. Given a student's practice results, write a 2-3 sentence encouraging summary that names their strongest area and the single most important thing to drill before the graded version. Use $...$ for any LaTeX. Respond as strict JSON: {\"summary\": string}.",
      JSON.stringify({
        title: pa.title,
        percent: Math.round(percent),
        perProblem: perProblem.map((p) => ({
          topic: p.topicTitle,
          correct: p.correct,
        })),
      }),
      undefined,
      (value): value is { summary: string } => nonEmptyString((value as { summary?: unknown }).summary),
    );
    overallFeedback = out.summary || null;
  } catch {
    overallFeedback = null;
  }

  res.json(
    SubmitPracticeAssignmentResponse.parse({
      id,
      score,
      total,
      percent,
      overallFeedback,
      perProblem,
    }),
  );
});

// GET /practice-assignments/:id/dialogue
router.get("/practice-assignments/:id/dialogue", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = parseIdParam(req.params.id);
  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(
      and(eq(practiceAssignmentsTable.id, id), eq(practiceAssignmentsTable.userId, userId)),
    );
  if (!pa) {
    res.status(404).json({ error: "not found" });
    return;
  }
  const rows = await db
    .select()
    .from(feedbackMessagesTable)
    .where(eq(feedbackMessagesTable.practiceAssignmentId, id))
    .orderBy(asc(feedbackMessagesTable.id));
  res.json(
    rows.map((m) =>
      GetFeedbackMessagesResponseItem.parse({
        id: m.id,
        role: m.role as "user" | "tutor",
        content: m.content,
        problemId: m.problemId,
        createdAt: m.createdAt.toISOString(),
      }),
    ),
  );
});

// POST /practice-assignments/:id/dialogue — ask a follow-up about the feedback.
router.post("/practice-assignments/:id/dialogue", async (req, res): Promise<void> => {
  const userId = getUserId(req);
  const id = parseIdParam(req.params.id);
  const parsed = PostFeedbackMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { problemId, message } = parsed.data;

  const [pa] = await db
    .select()
    .from(practiceAssignmentsTable)
    .where(
      and(eq(practiceAssignmentsTable.id, id), eq(practiceAssignmentsTable.userId, userId)),
    );
  if (!pa) {
    res.status(404).json({ error: "not found" });
    return;
  }

  // Ground the dialogue in the specific problem + the student's graded answer.
  let context = "";
  if (problemId != null) {
    const [problem] = await db
      .select()
      .from(practiceAssignmentProblemsTable)
      .where(
        and(
          eq(practiceAssignmentProblemsTable.id, problemId),
          eq(practiceAssignmentProblemsTable.practiceAssignmentId, id),
        ),
      );
    const [answer] = await db
      .select()
      .from(practiceAssignmentAnswersTable)
      .where(
        and(
          eq(practiceAssignmentAnswersTable.practiceAssignmentId, id),
          eq(practiceAssignmentAnswersTable.problemId, problemId),
        ),
      );
    if (problem) {
      context = JSON.stringify({
        prompt: problem.prompt,
        correctAnswer: problem.correctAnswer,
        explanation: problem.explanation,
        studentAnswer: answer?.answer ?? "",
        wasCorrect: answer?.correct ?? null,
        priorFeedback: answer?.feedback ?? "",
      });
    }
  }

  // Recent thread for continuity (same scope).
  const history = await db
    .select()
    .from(feedbackMessagesTable)
    .where(eq(feedbackMessagesTable.practiceAssignmentId, id))
    .orderBy(desc(feedbackMessagesTable.id))
    .limit(10);
  const recent = history
    .reverse()
    .filter((m) => (problemId == null ? m.problemId == null : m.problemId === problemId))
    .map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`)
    .join("\n");

  let reply = "";
  try {
    reply = (
      await chatJson<{ reply: string }>(
        [
          "You are a patient calculus tutor continuing a conversation about feedback on a practice problem.",
          "Answer the student's question directly and concretely, referencing their actual answer and the problem when relevant. Use $...$ for LaTeX. Keep it to a few sentences unless they ask for a full worked solution.",
          'Respond as strict JSON: {"reply": string}.',
        ].join("\n"),
        JSON.stringify({
          problemContext: context || "(general question about this practice assignment)",
          conversationSoFar: recent,
          studentQuestion: message,
        }),
        undefined,
        (value): value is { reply: string } => nonEmptyString((value as { reply?: unknown }).reply),
      )
    ).reply;
  } catch (err) {
    req.log.error({ err }, "feedback dialogue failed");
    res.status(503).json({ error: AI_UNAVAILABLE_MESSAGE, retryable: true });
    return;
  }

  await db.insert(feedbackMessagesTable).values({
    userId,
    practiceAssignmentId: id,
    problemId: problemId ?? null,
    role: "user",
    content: message,
  });

  const [stored] = await db
    .insert(feedbackMessagesTable)
    .values({
      userId,
      practiceAssignmentId: id,
      problemId: problemId ?? null,
      role: "tutor",
      content: reply,
    })
    .returning();

  await logActivity({ userId, kind: "feedback_dialogue", refId: id });

  res.json(
    PostFeedbackMessageResponse.parse({
      id: stored!.id,
      role: "tutor",
      content: reply,
      problemId: problemId ?? null,
      createdAt: stored!.createdAt.toISOString(),
    }),
  );
});

export default router;
