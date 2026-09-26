import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const dir = ".agents/outputs/calculus-recording";
const clips = [
  "01-dashboard-schedule", "02-reading-depths", "03-tutor-math-keyboard",
  "04-live-tutor-response", "05-homework-entry-and-persistence", "06-real-grading-feedback",
];
const probe = file => Number(execFileSync("ffprobe", [
  "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file,
], { encoding: "utf8" }).trim());
const segments = [];
for (const [i, clip] of clips.entries()) {
  const video = `${dir}/${clip}.mp4`;
  const audio = `attached_assets/generated_audio/calculus-demo-${i + 1}.mp3`;
  const duration = Math.max(probe(video) - 0.6, probe(audio) + 0.6);
  const output = `${dir}/narrated-${i + 1}.mp4`;
  execFileSync("ffmpeg", [
    "-y", "-ss", "0.6", "-i", video, "-i", audio,
    "-filter_complex",
    `[0:v]scale=1920:1080:flags=lanczos,fps=30,tpad=stop_mode=clone:stop_duration=30[v];` +
    "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,apad[a]",
    "-map", "[v]", "-map", "[a]", "-t", String(duration),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-ar", "48000", "-b:a", "192k", "-movflags", "+faststart", output,
  ], { stdio: ["ignore", "ignore", "pipe"] });
  segments.push(output);
}
const list = `${dir}/concat.txt`;
writeFileSync(list, segments.map(file => `file '${path.resolve(file)}'`).join("\n"));
const publicDir = "artifacts/qr-course-demo/public";
mkdirSync(publicDir, { recursive: true });
const final = `${publicDir}/calculus-demonstration.mp4`;
execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", list,
  "-c", "copy", "-movflags", "+faststart", final], { stdio: ["ignore", "ignore", "pipe"] });
const duration = probe(final);
writeFileSync("artifacts/qr-course-demo/src/components/video/recording.ts",
  `// Duration of the actual narrated screen recording.\nexport const DEMO_DURATION_MS = ${Math.round(duration * 1000)};\n`);
console.log(JSON.stringify({ file: final, duration, width: 1920, height: 1080 }));