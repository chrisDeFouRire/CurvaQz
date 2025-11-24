# CurvaQz Architecture

High-level view of the current webapp based on known specs and docs.

## Overview

- Goal: football quiz webapp that plays instantly, stays fresh, and is optimized for viral sharing (links + QR codes).
- Audience: players, creators/influencers who publish themed/white-label quizzes, and future advertisers.
- Hosting: Cloudflare Workers; Wrangler manages local dev and deploy.

## Runtime & Delivery

- Entry: Astro builds the static UI; React 19 components are rendered into the Astro app.
- Worker: Cloudflare Worker serves the APIs; static assets routed via Wrangler rules.
- Styling: Tailwind CSS v4 utilities generated via `@tailwindcss/postcss`.
- Languages: TypeScript throughout; JSX via React runtime.

## Data & Storage (planned)

- Cloudflare KV: cache quizzes to keep play fast and reduce quiz API calls.
- Cloudflare D1: primary store for quizzes/questions/results and leaderboards as flows mature.
- Durable Objects / Queues: reserved for future real-time or live/halftime quiz rooms.

## External Quiz API (current source)

- Base: `https://clashui.inia.fr/api/quiz` with Basic Auth.
- Key endpoints: `/leagues`, `/teams?league=...`, `/fixtures` (last 10), `/fixtures_50` (last 50), `/quiz` (by fixture), `/last` (latest fixture in league).
- Quiz parameters include `distinct`, `shuffle`, `length`, `fixture|league`, `nbAnswers`, `lang` (`fr|en|es|de`).
- League selection: Dynamic - fetches all leagues and randomly selects one for each quiz generation.

## Product/UX pillars

- Immediate play: no login to play; accounts only for publishing/creator identity/payouts.
- Every quiz is unique: avoid repeats; large question pool via API + editorial (future AI enrichment).
- Viral sharing: strongest moment after quiz; shareable link + QR code; compare vs creator and leaderboard preview.
- Creator/white-label: creators can apply themes (colors/background/logo/share card) and distribute via links/QR.

## Core flows (V0 focus)

1) Generate quiz (API-driven) with light customization.
2) Play quiz (mobile-first, 5–10 Qs, snappy feedback).
3) Results/answers showing score and creator comparison.
4) Leaderboard with share CTA.

## Tooling & conventions

- Scripts: `npm run ui` (Astro dev), `npm run dev` (build + Wrangler dev), `npm run build`, `npm run preview`, `npm run lint` (ESLint across TS/TSX/Astro), `npm run check` (Astro check).
- Coding: TypeScript, concise React components, Tailwind utilities; 2-space indent; avoid unchecked `any`.
- Git/process: Conventional Commits; update docs when behavior changes; specs tracked under `openspec/`.

## Future considerations

- Ads: audio ads during gameplay; optional display ads post-quiz with creator revenue share.
- Pre-generation: cron/worker jobs to prebuild quizzes for upcoming matches (especially halftime).
- Mocking: local mocks of the quiz API are acceptable to keep development fast when the upstream is unavailable.
