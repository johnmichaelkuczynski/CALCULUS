import { db, topicsTable, lecturesTable, assignmentsTable, problemsTable, attemptsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { calculusLectures, expandedLecture } from "./calculusCurriculum";
import { logger } from "./logger";

type Problem = { topic: string; prompt: string; answer: string; explanation: string; hint: string };
type Assignment = { kind: "homework" | "midterm" | "final"; title: string; week: number; minutes: number | null; instructions: string; problems: Problem[] };
const q = (topic: string, prompt: string, answer: string, explanation: string, hint: string): Problem =>
  ({ topic, prompt, answer, explanation, hint });

// Prompts and keys are from the uploaded calculus course, including their exam order.
const derivative = q("1.5", "Write the limit definition of the derivative f′(x).", "f′(x) = lim_(h→0) [f(x + h) − f(x)] / h", "Take the limit of the secant slope as the horizontal displacement h approaches zero.", "Start with the slope between x and x+h.");
const continuity = q("1.4", "Write the condition for f to be continuous at x = a.", "lim_(x→a) f(x) = f(a)", "Continuity requires the value and the two-sided limit to exist and agree.", "Compare the limit with the function value.");
const trigLimit = q("1.3", "Write the fundamental trigonometric limit as x → 0.", "lim_(x→0) sin x / x = 1", "For angles in radians, sin x approaches x at the same rate near zero.", "Think of sin x divided by x, in radians.");
const power = q("1.6", "Write the power rule for d/dx x^n.", "d/dx x^n = n x^(n−1)", "Bring the exponent down as a coefficient and reduce it by one.", "Differentiate x squared as a check.");
const product = q("1.6", "Write the product rule for (fg)′.", "(fg)′ = f′g + fg′", "Differentiate one factor at a time and add the two terms.", "Keep one factor unchanged in each term.");
const quotient = q("1.6", "Write the quotient rule for (f/g)′.", "(f/g)′ = (f′g − fg′) / g²", "The numerator is derivative of top times bottom, minus top times derivative of bottom; square the denominator.", "The denominator is g squared.");
const sine = q("1.7", "Write the derivative of sin x.", "d/dx sin x = cos x", "The derivative is cosine when x is measured in radians.", "Use radians.");
const exponential = q("1.7", "Write the derivative of e^x.", "d/dx e^x = e^x", "The natural exponential is its own derivative.", "The base e is special.");
const chain = q("2.1", "Write the chain rule for d/dx f(g(x)).", "d/dx f(g(x)) = f′(g(x)) · g′(x)", "Differentiate the outer function at the inner expression, then multiply by the inner derivative.", "Outer derivative times inner derivative.");
const logarithm = q("2.2", "Write the derivative of ln x.", "d/dx ln x = 1/x", "Natural logarithm is the inverse of the exponential and differentiates to the reciprocal.", "What function has ln x as an antiderivative?");
const linearization = q("2.4", "Write the linearization L(x) of f at x = a.", "L(x) = f(a) + f′(a)(x − a)", "The tangent has value f(a) and slope f′(a) at the base point.", "Use the point-slope equation of the tangent.");
const newton = q("2.4", "Write the Newton's method iteration for x_(n+1).", "x_(n+1) = x_n − f(x_n) / f′(x_n)", "Intersect the tangent at x_n with the x-axis to obtain the next approximation.", "Start at x_n and subtract the height divided by slope.");
const mvt = q("2.5", "Write the conclusion of the mean value theorem on [a, b].", "f′(c) = [f(b) − f(a)] / (b − a)", "Some interior tangent slope equals the average slope over the interval, assuming continuity and differentiability.", "Instantaneous rate equals average rate at some c.");
const integralPower = q("3.1", "Write the power rule for ∫ x^n dx, n ≠ −1.", "∫ x^n dx = x^(n+1) / (n + 1) + C", "Increase the exponent by one, divide by the new exponent, and include the constant.", "Reverse the derivative power rule.");
const ftc1 = q("3.4", "Write the fundamental theorem of calculus, Part 1.", "d/dx ∫_a^x f(t) dt = f(x)", "The rate of accumulation of area up to x is the integrand at x.", "Differentiate an accumulation function.");
const ftc2 = q("3.4", "Write the fundamental theorem of calculus, Part 2, for an antiderivative F.", "∫_a^b f(x) dx = F(b) − F(a)", "Evaluate the antiderivative at the upper limit and subtract its value at the lower limit.", "Upper endpoint minus lower endpoint.");
const parts = q("3.6", "Write the integration by parts formula.", "∫ u dv = uv − ∫ v du", "Integrate the product rule (uv)′ = u′v + uv′ and rearrange.", "Reverse the product rule.");
const volume = q("4.2", "Write the disk-method volume for y = f(x) rotated about the x-axis on [a, b].", "V = π ∫_a^b [f(x)]² dx", "Each cross-section is a disk of radius f(x), with area π[f(x)]².", "Integrate π times the square of the radius.");
const growth = q("4.3", "Write the solution of dy/dt = ky with initial value y_0.", "y = y_0 e^(kt)", "Separating and integrating dy/y = k dt gives an exponential; the initial value fixes its coefficient.", "Growth is proportional to current amount.");
const hopital = q("4.4", "Write L'Hôpital's rule for lim f(x)/g(x) as x → a.", "lim_(x→a) f(x)/g(x) = lim_(x→a) f′(x)/g′(x)", "For an indeterminate 0/0 or ∞/∞ form, differentiate numerator and denominator separately when the derivative quotient's limit exists.", "Only apply to an indeterminate quotient.");
const taylor = q("4.7", "Write the Taylor series of f centered at a.", "f(x) = Σ_(n=0)^∞ f^(n)(a) (x − a)^n / n!", "The nth coefficient is determined by the nth derivative at a divided by n factorial, wherever the Taylor series represents f.", "Start with f(a), then f′(a)(x−a).");

export const calculusTopicSlugs = calculusLectures.map(l => `calculus-${l.number.replace(".", "-")}`);
export const calculusAssignmentTitles = ["Homework 1.1 — Limits and the derivative", "Homework 1.2 — Differentiation rules", "Midterm — Weeks 1 & 2", "Final Exam — Calculus"];
const assignments: Assignment[] = [
  {
    kind: "homework", title: calculusAssignmentTitles[0]!, week: 1, minutes: null,
    instructions: "Short-answer problems on limits and derivatives. Write each answer as the key formula in symbols using the on-screen math keyboard (use the Calculus and Trigonometry tabs for limits, primes, and Greek letters).",
    problems: [derivative, continuity, trigLimit, power],
  },
  {
    kind: "homework", title: calculusAssignmentTitles[1]!, week: 1, minutes: null,
    instructions: "Use the math keyboard for fractions, primes, and exponents.",
    problems: [product, quotient, sine, exponential],
  },
  {
    kind: "midterm", title: calculusAssignmentTitles[2]!, week: 2, minutes: 60,
    instructions: "Cumulative midterm on limits, derivatives, and applications of differentiation. 60 minutes. Math keyboard available; pasting disabled.",
    problems: [derivative, product, quotient, chain, logarithm, linearization, newton, mvt],
  },
  {
    kind: "final", title: calculusAssignmentTitles[3]!, week: 4, minutes: 90,
    instructions: "Cumulative final covering all four weeks. 90 minutes. Math keyboard available; pasting disabled.",
    problems: [derivative, chain, integralPower, ftc1, ftc2, parts, volume, growth, hopital, taylor],
  },
];

// Add/update only calculus records. In particular, never delete an older course,
// completed attempts, answers, practice sessions, or learner progress.
export async function seedIfEmpty(): Promise<void> {
  const ids = new Map<string, number>();
  for (const [position, l] of calculusLectures.entries()) {
    const weekNumber = Number(l.number[0]);
    const slug = `calculus-${l.number.replace(".", "-")}`;
    const [topic] = await db.insert(topicsTable)
      .values({ slug, title: l.title, weekNumber, blurb: l.blurb, position })
      .onConflictDoUpdate({ target: topicsTable.slug, set: { title: l.title, weekNumber, blurb: l.blurb, position } })
      .returning();
    if (!topic) throw new Error(`Could not seed calculus topic ${slug}`);
    ids.set(l.number, topic.id);
    const values = { weekNumber, title: `${l.number} ${l.title}`, body: l.body, ...expandedLecture(l.number, l.body) };
    const [existing] = await db.select().from(lecturesTable).where(eq(lecturesTable.topicId, topic.id)).limit(1);
    if (existing) await db.update(lecturesTable).set(values).where(eq(lecturesTable.id, existing.id));
    else await db.insert(lecturesTable).values({ ...values, topicId: topic.id });
  }

  for (const [position, a] of assignments.entries()) {
    const candidates = await db.select().from(assignmentsTable).where(eq(assignmentsTable.title, a.title));
    let existing: (typeof candidates)[number] | undefined;
    for (const candidate of candidates) {
      const [first] = await db.select().from(problemsTable).where(eq(problemsTable.assignmentId, candidate.id)).limit(1);
      if (!first || [...ids.values()].includes(first.topicId)) { existing = candidate; break; }
    }
    const values = { kind: a.kind, title: a.title, weekNumber: a.week, position, isTimed: a.minutes !== null, timeLimitMinutes: a.minutes, instructions: a.instructions };
    const [record] = existing
      ? await db.update(assignmentsTable).set(values).where(eq(assignmentsTable.id, existing.id)).returning()
      : await db.insert(assignmentsTable).values(values).returning();
    if (!record) throw new Error(`Could not seed assignment ${a.title}`);
    const [attempt] = await db.select({ id: attemptsTable.id }).from(attemptsTable).where(eq(attemptsTable.assignmentId, record.id)).limit(1);
    // Never rewrite or append questions to an assignment a learner has started.
    if (attempt) continue;
    const previous = await db.select().from(problemsTable).where(eq(problemsTable.assignmentId, record.id));
    for (const [index, problem] of a.problems.entries()) {
      const topicId = ids.get(problem.topic);
      if (!topicId) throw new Error(`Missing topic for ${problem.topic}`);
      const data = { topicId, assignmentId: record.id, position: index, prompt: problem.prompt, correctAnswer: problem.answer, explanation: problem.explanation, hint: problem.hint };
      const old = previous.find((p: (typeof previous)[number]) => p.position === index);
      if (old) await db.update(problemsTable).set(data).where(and(eq(problemsTable.id, old.id), eq(problemsTable.assignmentId, record.id)));
      else await db.insert(problemsTable).values(data);
    }
  }
  logger.info({ topics: calculusLectures.length, assignments: assignments.length }, "Calculus curriculum upserted without deleting learner data");
}