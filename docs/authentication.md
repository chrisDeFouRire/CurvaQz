# Authentication and Identity

Authentication is session-first: players can start a quiz instantly, then attach a name or social login later. A lightweight JWT (1 hour) avoids DB hits on every request; the refresh API verifies the session ↔ user link in the DB before issuing a new JWT.

## Identifiers

- `sessionId`: Generated on first visit (128-bit+ entropy, base64url). Persist in `localStorage` (for client logic) and in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie for server access. Rotate if suspected compromise; expire after ~30 days of inactivity.
- `userId` (optional): Created once the player sets a name or completes OAuth. Stored in the DB and linked to `sessionId`.
- `displayName`: Optional until post-quiz. Leaderboards show either the set name or a placeholder derived from `sessionId` (e.g., `Player-XYZ`) until the user provides one.

## Tokens

- Access token: JWT valid for 1 hour; signed (HS256/RS256) with server-held keys only. Claims: `sub` = `userId` (if present), `sid` = `sessionId`, `iat`, `exp`, `iss`, `aud`, optional `name`. Keep payload minimal to avoid leakage.
- Storage: Prefer `Secure` + `HttpOnly` cookie for the JWT to reduce XSS risk; the client may also keep a copy in memory if needed for fetch headers (avoid persisting in `localStorage`).

## Client Flow

1. Bootstrap: read `sessionId` from cookie/localStorage; if missing, create one and persist.
2. Request access: call auth bootstrap/refresh endpoint with `sessionId` to receive a 1-hour JWT.
3. Play quiz: send JWT on API calls. No upfront account required.
4. Post-quiz identity:
   - Set name: submit name tied to `sessionId`; DB records name + `sessionId`; issue new JWT with `name`.
   - Social login (Google/Facebook): complete OAuth, link provider account → `userId`; associate with current `sessionId`; issue new JWT with `sub` and `name`.
5. Leaderboard: use `sessionId` for continuity; once a name/social identity is attached, show that name for existing scores.

## Refresh & Rotation

- Refresh endpoint: accepts the existing refresh cookie/session proof, looks up `sessionId` → `userId` in DB, and issues a fresh 1-hour JWT. Reject if mapping missing, revoked, or expired.
- Token rotation: on each refresh, rotate refresh token identifiers (stored hashed) to prevent replay; keep a short grace window to allow concurrent tabs.
- Revocation: invalidating a session/user in DB blocks further refresh; force clients to bootstrap a new anonymous session if needed.

## Best Practices

- Use TLS everywhere; set `Secure`, `HttpOnly`, `SameSite=Lax` on cookies; add `SameSite=None` only when required for cross-site embeds.
- Rate-limit auth/refresh endpoints; throttle failed login attempts; log suspicious activity with `sessionId` and provider IDs (no PII).
- Validate JWT audience/issuer/expiry on every request; refuse unsigned/`none` alg tokens.
- Limit CORS origins to the webapp domain(s); require `Authorization: Bearer <jwt>` for API calls.
- Sanitize and length-limit display names; normalize encoding; store provider IDs hashed where possible.
