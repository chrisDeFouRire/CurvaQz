# CurvaQz

CurvaQz is a fast football quiz. Use the scripts below to develop and run it locally.

## Getting started

1. Install dependencies: `npm install`
2. Start the UI dev server: `npm run ui`
3. Build and run everything locally: `npm run dev`

## Scripts

- `npm run ui` – Dev server for the frontend.
- `npm run dev` – Build output and start the local backend on port 4321.
- `npm run build` – Production build.
- `npm run preview` – Preview the production build.
- `npm run lint` – Static checks via eslint.

## Environment

- Cloudflare KV namespace `QZ_CACHE` caches qz-api league/team lookups (configure IDs in `wrangler.jsonc`).
- `QZ_API_CACHE_TTL_SECONDS` sets the TTL (in seconds) for that cache, defaulting to `3600`.

## Notes

- Ensure Wrangler is configured (see `wrangler.jsonc`) for local API testing.
- TypeScript support is included; adjust `tsconfig.json` as needed.
