# Project Context

## Purpose

- Build CurvaQz, a football quiz webapp that plays instantly, stays fresh (no repeated quizzes), and is optimized for viral sharing via links/QR codes.
- Enable creators/influencers to publish themed/white-label quizzes, compare scores with their audience, and (later) earn ad revenue with minimal friction.

## Tech Stack

- TypeScript + React 19, rendered to HTML inside a Cloudflare Worker (entry at `src/index.tsx`).
- Cloudflare Workers runtime managed with `wrangler`; planned data/storage on Workers + KV/D1/Queues as flows mature.
- Styling with Tailwind CSS v4 (`tailwindcss` + `@tailwindcss/cli`), emitted to `src/styles/tailwind.css` and served from the worker.
- Tooling: npm + npm-run-all for concurrent dev scripts, TypeScript config in `tsconfig.json`, Wrangler rules to load CSS as text.

## Project Conventions

### Code Style

- Default to TypeScript, 2-space indentation, keep lines roughly ≤100–120 cols, avoid unchecked `any`, and prefer named exports in domain folders (quiz, creator, sharing, ads).
- React function components with concise JSX; Tailwind utility classes for styling; keep files small and focused on a domain.
- Follow Conventional Commits (feat:, fix:, chore:, docs:), keep commits small with rationale when behavior changes.

### Architecture Patterns

- Single Worker handles routing: serves HTML rendered via `renderToString`, static CSS at `/app.css`, and example health endpoint at `/api/health`.
- Frontend + backend live together in `src/`; CSS is imported as a module and returned by the Worker (see `wrangler.jsonc` Text rule).
- Future services: Cloudflare KV for caching quizzes, D1 for quiz/question/result storage, Durable Objects/Queues for real-time flows if needed.

### Testing Strategy

- Current placeholder `npm test`; use `npm run check` for type safety until tests are added.
- Target Vitest/Jest unit tests (fast, deterministic) with mocks for football data API/Perplexity/Cloudflare bindings; aim for ≥80% coverage as features land.
- Add integration tests for play/share/leaderboard once UI flows exist; keep external calls mocked to avoid network reliance.

### Git Workflow

- Conventional Commits required; keep focused commits and update `docs/` when behavior shifts (especially quiz generation, sharing, monetisation).
- Use feature branches per task (e.g., `feat/quiz-play`); rebase or merge per repo norms; request review on gameplay/data/security changes.

## Domain Context

- Product principles: immediate play (no login), every quiz is unique, viral sharing first (links + QR), influencer-friendly with creator attribution and leaderboards.
- Core screens (V0): create/generate quiz (API-driven), play (mobile-first), results/answers with creator comparison, leaderboard with share CTA.
- Sharing: strongest moment is post-quiz; provide scorecard + link + creator info; QR codes for live/social use; OpenGraph preview for links.
- Theming/white-label: creators can skin quizzes (colors/background/logo/share card). Users may submit themes later (trendable).
- Monetisation (later): audio ads during gameplay, optional display ads; creators can earn a share; accounts only needed for payouts/creator identity.
- Question sources: football API (primary), editorial questions, future AI enrichment via Perplexity with name validation; avoid latency spikes.

## Important Constraints

- No login required to play; accounts only when publishing/quitting payouts; keep friction minimal.
- Do not repeat quizzes for the same user; quizzes must feel fresh and non-trivial (avoid overly easy AI output).
- Keep latency low (avoid long AI calls), and never commit secrets; load keys via env/config ignored by git.
- Maintain strong football identity and immediate feedback; drop gambling-like mechanics (no tokens/credits/boosters).
- Keep deployment lightweight on Cloudflare; avoid heavy infra beyond Workers/KV/D1 unless justified.

## External Dependencies

- Football data API (Wandrille’s) for match/event questions.
- Perplexity (planned) for AI enrichment/validation of names/context.
- Cloudflare platform: Workers runtime (current), plus planned KV cache, D1 for persistence, and Durable Objects/Queues for real-time/live quiz flows.
