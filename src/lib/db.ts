export type SessionRow = {
  id: string;
  user_id: string | null;
  created_at: string;
  last_seen_at: string;
  revoked: number;
};

export type UserRow = {
  id: string;
  display_name: string | null;
  provider: string | null;
  provider_sub: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Expected D1 schema
 *
 * CREATE TABLE IF NOT EXISTS sessions (
 *   id TEXT PRIMARY KEY,
 *   user_id TEXT NULL,
 *   created_at TEXT NOT NULL,
 *   last_seen_at TEXT NOT NULL,
 *   revoked INTEGER NOT NULL DEFAULT 0
 * );
 *
 * CREATE TABLE IF NOT EXISTS users (
 *   id TEXT PRIMARY KEY,
 *   display_name TEXT NULL,
 *   provider TEXT NULL,
 *   provider_sub TEXT NULL,
 *   created_at TEXT NOT NULL,
 *   updated_at TEXT NOT NULL
 * );
 */

function nowIso(): string {
  return new Date().toISOString();
}

export async function getSession(db: D1Database, sessionId: string): Promise<SessionRow | null> {
  const result = await db
    .prepare(
      `SELECT id, user_id, created_at, last_seen_at, revoked
       FROM sessions
       WHERE id = ?
       LIMIT 1`
    )
    .bind(sessionId)
    .first<SessionRow>();

  return result ?? null;
}

export async function createSession(
  db: D1Database,
  sessionId: string,
  userId?: string | null
): Promise<SessionRow> {
  const timestamp = nowIso();
  await db
    .prepare(
      `INSERT INTO sessions (id, user_id, created_at, last_seen_at, revoked)
       VALUES (?, ?, ?, ?, 0)`
    )
    .bind(sessionId, userId ?? null, timestamp, timestamp)
    .run();

  return {
    id: sessionId,
    user_id: userId ?? null,
    created_at: timestamp,
    last_seen_at: timestamp,
    revoked: 0
  };
}

export async function touchSession(db: D1Database, sessionId: string): Promise<void> {
  await db
    .prepare(`UPDATE sessions SET last_seen_at = ? WHERE id = ?`)
    .bind(nowIso(), sessionId)
    .run();
}

export async function linkSessionToUser(
  db: D1Database,
  sessionId: string,
  userId: string
): Promise<void> {
  await db
    .prepare(`UPDATE sessions SET user_id = ?, last_seen_at = ? WHERE id = ?`)
    .bind(userId, nowIso(), sessionId)
    .run();
}

export async function getUser(db: D1Database, userId: string): Promise<UserRow | null> {
  const result = await db
    .prepare(
      `SELECT id, display_name, provider, provider_sub, created_at, updated_at
       FROM users
       WHERE id = ?
       LIMIT 1`
    )
    .bind(userId)
    .first<UserRow>();

  return result ?? null;
}

export async function upsertUser(
  db: D1Database,
  user: {
    id: string;
    displayName?: string | null;
    provider?: string | null;
    providerSub?: string | null;
  }
): Promise<UserRow> {
  const timestamp = nowIso();

  await db
    .prepare(
      `INSERT INTO users (id, display_name, provider, provider_sub, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         display_name = coalesce(excluded.display_name, users.display_name),
         provider = coalesce(excluded.provider, users.provider),
         provider_sub = coalesce(excluded.provider_sub, users.provider_sub),
         updated_at = excluded.updated_at`
    )
    .bind(
      user.id,
      user.displayName ?? null,
      user.provider ?? null,
      user.providerSub ?? null,
      timestamp,
      timestamp
    )
    .run();

  const updated = await getUser(db, user.id);
  if (!updated) {
    throw new Error("Failed to upsert user");
  }

  return updated;
}
