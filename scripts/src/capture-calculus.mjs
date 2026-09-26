// Real Chromium/Playwright footage of the live Calculus UI. No request interception,
// fixture responses, synthetic frames, overlays, or audio.
// Run from workspace root: node scripts/src/capture-calculus.mjs
import { chromium } from "playwright";
import { mkdir, unlink } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const exec = promisify(execFile);
const base = process.env.CALCULUS_URL ?? "http://localhost:80";
const out = path.resolve(".agents/outputs/calculus-recording");
await mkdir(out, { recursive: true });
const viewport = { width: 1600, height: 900 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function assert(ok, message) { if (!ok) throw new Error(message); }

// This is the PDF-derived answer key transcribed in artifacts/api-server/src/lib/seed.ts.
// Check both the visible prompt and key origin before using these answers.
const answers = [
  { prompt: "limit definition of the derivative", answer: "f′(x) = lim_(h→0) [f(x + h) − f(x)] / h" },
  { prompt: "continuous at x = a", answer: "lim_(x→a) f(x) = f(a)" },
  { prompt: "fundamental trigonometric limit", answer: "lim_(x→0) sin x / x = 1" },
  { prompt: "power rule for d/dx", answer: "d/dx x^n = n x^(n−1)" },
];
const recordings = [];
const browser = await chromium.launch({
  headless: true, executablePath: "/repl/tools/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport, screen: viewport, deviceScaleFactor: 1,
  recordVideo: { dir: out, size: viewport },
  reducedMotion: "reduce",
});
context.setDefaultTimeout(18000);

async function open(url) {
  const page = await context.newPage();
  await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded" });
  return page;
}
async function finish(page, filename, maxLength = 0) {
  const video = page.video();
  await page.close();
  const raw = await video.path();
  const destination = path.join(out, filename);
  const duration = Number((await exec("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", raw])).stdout.trim());
  // If a real provider spent a long time thinking, remove ONLY the idle middle
  // by concatenating original screen footage from the start and from the end.
  const args = maxLength && duration > maxLength
    ? ["-y", "-i", raw, "-filter_complex",
      `[0:v]trim=start=0:duration=${Math.min(7, maxLength / 2)},setpts=PTS-STARTPTS[a];` +
      `[0:v]trim=start=${Math.max(0, duration - (maxLength - Math.min(7, maxLength / 2)))},setpts=PTS-STARTPTS[b];` +
      "[a][b]concat=n=2:v=1:a=0[v]",
      "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", destination]
    : ["-y", "-i", raw, "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", destination];
  await exec("ffmpeg", args, { maxBuffer: 1024 * 1024 });
  await unlink(raw);
  const finalDuration = Number((await exec("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", destination])).stdout.trim());
  recordings.push({ filename, duration: +finalDuration.toFixed(2) });
  console.log(`${filename}: ${finalDuration.toFixed(2)}s (raw: ${duration.toFixed(2)}s)`);
}
async function selectSlot(page, input, expected) {
  await page.waitForTimeout(200); // UI schedules focus/selection via requestAnimationFrame.
  const state = await input.evaluate((el) => ({
    text: el.value.slice(el.selectionStart, el.selectionEnd),
    value: el.value,
  }));
  assert(state.text === "□", `${expected}: expected selected □ slot; got ${JSON.stringify(state)}`);
}
async function typeSlot(page, input, text, expected) {
  await selectSlot(page, input, expected);
  await input.pressSequentially(text, { delay: 55 });
  assert(!(await input.inputValue()).includes(text + "□"), `${expected}: slot was not replaced`);
}
async function waitForSave(page) {
  // A save request is emitted on each input change. Check persisted data after
  // the most recent save resolves, and again via an actual UI reload below.
  await page.waitForTimeout(550);
}

try {
  let page = await open("/dashboard");
  await page.getByRole("heading", { name: "Course Schedule" }).waitFor();
  await page.getByText("8 Lectures").waitFor();
  const counts = await page.locator("text=/[0-9]+ Lectures/").allTextContents();
  assert(counts.reduce((n, text) => n + Number.parseInt(text, 10), 0) === 29,
    `Dashboard must display 29 lectures, got ${counts}`);
  await sleep(3500);
  await page.getByText("Week 1 — Limits and derivatives").first().click();
  await page.getByRole("heading", { name: "Lectures" }).waitFor();
  await page.mouse.wheel(0, 540);
  await sleep(3200);
  await finish(page, "01-dashboard-schedule.mp4");

  page = await open("/lectures/1");
  await page.getByRole("heading", { name: "1.1 The tangent and velocity problems" }).waitFor();
  for (const level of ["short", "medium", "long"]) {
    const button = page.getByTestId(`button-level-${level}`);
    assert(await button.isEnabled(), `${level} lecture reading is not available`);
    await button.click();
    assert((await button.getAttribute("class")).includes("bg-primary"), `${level} did not activate`);
    await sleep(2300);
  }
  await finish(page, "02-reading-depths.mp4");

  page = await open("/lectures/1");
  let chat = page.getByTestId("input-math-chat");
  await chat.waitFor();
  await page.getByTestId("button-toggle-math-keyboard").click();
  await chat.click();
  await chat.pressSequentially("What is ", { delay: 85 });
  await page.getByTestId("mathkb-template-Fraction").click();
  await typeSlot(page, chat, "1", "tutor numerator");
  await page.getByTestId("mathkb-next-slot").click();
  await typeSlot(page, chat, "2", "tutor denominator");
  assert((await chat.inputValue()).includes("\\frac{1}{2}"), "fraction slots were not filled");
  await page.getByLabel("Math preview").waitFor();
  await sleep(850);
  await chat.press("ControlOrMeta+A");
  await chat.press("Backspace");
  await page.getByTestId("mathkb-template-Limit").click();
  await typeSlot(page, chat, "0", "tutor limit approach");
  await page.getByTestId("mathkb-next-slot").click();
  await typeSlot(page, chat, "x", "tutor limit expression");
  assert((await chat.inputValue()).includes("\\lim_{x\\to 0} x"), "limit slots were not filled");
  await page.getByLabel("Math preview").waitFor();
  await sleep(3100);
  await finish(page, "03-tutor-math-keyboard.mp4");

  page = await open("/lectures/1");
  chat = page.getByTestId("input-math-chat");
  await chat.waitFor();
  await page.getByTestId("button-dismiss-all-suggestions").click();
  await chat.click();
  const question = "For s(t)=16t^2, why does the instantaneous velocity at t=2 equal 64?";
  await chat.pressSequentially(question, { delay: 20 });
  await page.getByTestId("button-send-math-chat").click();
  await page.getByText(question, { exact: true }).waitFor();
  const replyElement = page.locator(".self-start .prose").filter({ hasText: /velocity|64|derivative/i }).first();
  await replyElement.waitFor({ timeout: 120000 });
  const reply = await replyElement.innerText();
  assert(reply.length > 30 && !/tutor error|couldn't respond/i.test(reply), `Tutor response invalid: ${reply}`);
  await replyElement.scrollIntoViewIfNeeded();
  await sleep(4400);
  await finish(page, "04-live-tutor-response.mp4", 14);

  const overview = await (await context.request.get(`${base}/api/course/overview`)).json();
  const homework = overview.weeks.flatMap((week) => week.assignments).find((a) => a.title.startsWith("Homework 1.1"));
  assert(homework, "Homework 1.1 missing from live course overview");
  page = await open(`/assignments/${homework.id}`);
  await page.getByRole("heading", { name: homework.title }).waitFor();
  let input = page.locator('textarea[placeholder="Type your answer here..."]');
  await input.waitFor();
  assert(await page.getByText(answers[0].prompt, { exact: false }).count(), "Homework problem 1 does not match PDF answer key");
  // Demonstrate editable on-screen template with actual slot replacement before
  // entering the PDF key exactly (for deterministic key-based grading).
  await page.getByTestId("mathkb-template-Fraction").click();
  await typeSlot(page, input, "f(x+h)-f(x)", "homework numerator");
  await page.getByTestId("mathkb-next-slot").click();
  await typeSlot(page, input, "h", "homework denominator");
  assert((await input.inputValue()) === "\\frac{f(x+h)-f(x)}{h}", "homework fraction is incorrect");
  await page.getByLabel("Math preview").waitFor();
  await sleep(500);
  for (let i = 0; i < answers.length; i++) {
    if (i) {
      await page.getByRole("button", { name: "Next", exact: true }).click();
      assert(await page.getByText(answers[i].prompt, { exact: false }).count(),
        `Homework problem ${i + 1} does not match PDF answer key`);
    }
    await input.click();
    await input.press("ControlOrMeta+A");
    await input.pressSequentially(answers[i].answer, { delay: 10 });
    assert((await input.inputValue()) === answers[i].answer, `Homework ${i + 1} entry mismatch`);
    await waitForSave(page);
  }
  await page.getByRole("button", { name: "Previous" }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await input.waitFor();
  // AssignmentRunner starts/resumes the server-side attempt after reload.
  await page.waitForFunction((answer) => document.querySelector('textarea[placeholder="Type your answer here..."]')?.value === answer,
    answers[0].answer, { timeout: 15000 });
  for (let i = 0; i < answers.length; i++) {
    assert((await input.inputValue()) === answers[i].answer, `Homework ${i + 1} did not survive reload`);
    if (i < answers.length - 1) await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  await sleep(1600);
  await finish(page, "05-homework-entry-and-persistence.mp4", 19);

  page = await open(`/assignments/${homework.id}`);
  input = page.locator('textarea[placeholder="Type your answer here..."]');
  await page.getByRole("heading", { name: homework.title }).waitFor();
  await input.waitFor();
  for (let i = 0; i < answers.length - 1; i++) {
    assert((await input.inputValue()) === answers[i].answer, `Saved answer ${i + 1} missing before submission`);
    await page.getByRole("button", { name: "Next", exact: true }).click();
  }
  assert((await input.inputValue()) === answers.at(-1).answer, "Saved last answer missing before submission");
  await sleep(1000);
  await page.getByRole("button", { name: "Submit Assignment" }).click();
  await page.getByRole("heading", { name: /Homework 1.1.*Results/ }).waitFor({ timeout: 150000 });
  const results = await page.locator("main, body").last().innerText();
  assert(results.includes("Score:") && results.includes("Explanation:") &&
    results.includes("Problem 4"), "Grading result or per-problem feedback absent");
  console.log(results.match(/Score: [^\n]+/)?.[0]);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await sleep(2700);
  await page.mouse.wheel(0, 290);
  await sleep(3400);
  await finish(page, "06-real-grading-feedback.mp4", 14);
  console.log(JSON.stringify(recordings, null, 2));
} finally {
  await context.close();
  await browser.close();
}