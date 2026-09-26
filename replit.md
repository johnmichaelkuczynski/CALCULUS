# Calculus course

This project is a four-week Calculus course based on the supplied Calculus PDF. Keep the curriculum, navigation, assignments, downloadable course, and public README consistent with Calculus.

## Running on Replit

The pnpm workspace and existing artifact layout are retained.

1. Install the workspace dependencies with `pnpm install --frozen-lockfile`.
2. The API uses the configured PostgreSQL `DATABASE_URL`. Do not substitute another database or print its credentials.
3. For an empty development database, apply the existing schema with `pnpm --filter @workspace/db run push`.
4. Start the managed workflows:
   - `artifacts/api-server: API Server`
   - `artifacts/qr-course: web`
5. Open the Calculus artifact at `/`. Its API is routed at `/api`.

The API startup upserts the Calculus curriculum without deleting learner data. Do not restore the imported destructive reseeding behavior. Legacy course records may remain in storage, but active course endpoints must show Calculus only.

## Verification

- `pnpm run typecheck:libs`
- `pnpm --filter @workspace/api-server typecheck`
- `pnpm --filter @workspace/qr-course typecheck`
- `pnpm --filter @workspace/api-server test`
- `GET /api/healthz` and `GET /api/course/overview`

Use the shared proxy for local checks (`http://localhost:80`) rather than calling artifact ports directly.

## Providers

Six independent tutoring providers are configured through Replit Secrets:
`GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, and `GROK_API_KEY`.

`GPTZERO_API_KEY` is separate and is used for detection, not tutoring-provider failover. Never expose any key in browser code, logs, documentation, or recordings.

Prefer the student's selected provider, then try the other configured providers on failure. Preserve input and saved answers during outages. Never fabricate grades or pretend an unavailable AI service succeeded.

## Math entry

Chat, starter answers, practice, and assessments share cursor-aware math entry. Keep on-screen key insertion independent of textarea focus, support template-slot navigation, and preserve typing traces without classifying template insertion as pasted text.

## Public material and video

The root README is colorful public-facing course marketing, not an implementation document. Keep internal prompts, detection methods, credentials, and other internal details out of it.

The product demonstration must be real recorded app interactions, in 16:9, with a masculine narrator describing the visible actions and functionality. No music, simulated results, or promotional overlays obstructing the app.