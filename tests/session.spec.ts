import { describe, expect, it, beforeEach, vi } from "vitest";
import { app } from "../src/worker";
import type { SessionRow } from "../src/lib/db";
import type { WorkerEnv } from "../src/types/worker";

class MockStatement {
  private bindings: unknown[] = [];
  constructor(private readonly db: MockD1, private readonly query: string) {}

  bind(...values: unknown[]): MockStatement {
    this.bindings = values;
    return this;
  }

  async run() {
    return this.execute("run");
  }

  async first<T>() {
    return (await this.execute("first")) as T | null;
  }

  private async execute(_mode: "run" | "first") {
    if (this.query.startsWith("INSERT INTO sessions")) {
      const [id, userId, createdAt, lastSeenAt] = this.bindings as [string, string | null, string, string];
      this.db.sessions.set(id, {
        id,
        user_id: userId ?? null,
        created_at: createdAt,
        last_seen_at: lastSeenAt,
        revoked: 0
      });
      return null;
    }

    if (this.query.startsWith("UPDATE sessions SET last_seen_at")) {
      const [ts, id] = this.bindings as [string, string];
      const session = this.db.sessions.get(id);
      if (session) {
        session.last_seen_at = ts;
        this.db.sessions.set(id, session);
      }
      return null;
    }

    if (this.query.startsWith("UPDATE sessions SET user_id")) {
      const [userId, ts, id] = this.bindings as [string, string, string];
      const session = this.db.sessions.get(id);
      if (session) {
        session.user_id = userId;
        session.last_seen_at = ts;
        this.db.sessions.set(id, session);
      }
      return null;
    }

    if (this.query.startsWith("SELECT id, user_id")) {
      const [id] = this.bindings as [string];
      return this.db.sessions.get(id) ?? null;
    }

    throw new Error(`Unhandled query in mock D1: ${this.query}`);
  }
}

class MockD1 {
  sessions = new Map<string, SessionRow>();

  prepare(query: string): MockStatement {
    return new MockStatement(this, query);
  }
}

function getCookies(res: Response): string[] {
  // Node/undici exposes getSetCookie for multiple cookies
  // @ts-expect-error - not in lib.dom yet
  if (typeof res.headers.getSetCookie === "function") {
    // @ts-expect-error
    return res.headers.getSetCookie();
  }
  const header = res.headers.get("set-cookie");
  if (!header) return [];
  return header.split(/,(?=[^;]+=[^;]+)/);
}

describe("session routes", () => {
  const AUTH_SECRET = "test-secret";
  let env: WorkerEnv;
  let db: MockD1;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
    db = new MockD1();
    env = {
      AUTH_SECRET,
      DB: db as unknown as D1Database,
      JWT_ISSUER: "test-issuer"
    } as unknown as WorkerEnv;
  });

  it("bootstrap creates a new session and sets cookies", async () => {
    const res = await app.fetch(new Request("https://example.com/api/session/bootstrap", { method: "POST" }), env);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBeTruthy();
    expect(body.userId).toBeNull();
    expect(body.token).toMatch(/^eyJ/); // JWT prefix
    expect(body.expiresAt).toBe(Date.parse("2024-01-01T01:00:00.000Z"));

    const cookies = getCookies(res);
    expect(cookies.some((c) => c.startsWith("cq_session="))).toBe(true);
    expect(cookies.some((c) => c.startsWith("cq_access="))).toBe(true);
  });

  it("bootstrap reuses existing active session", async () => {
    const sessionId = "existing-session";
    db.sessions.set(sessionId, {
      id: sessionId,
      user_id: null,
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      revoked: 0
    });

    const res = await app.fetch(
      new Request("https://example.com/api/session/bootstrap", {
        method: "POST",
        headers: { cookie: `cq_session=${sessionId}` }
      }),
      env
    );

    const body = await res.json();
    expect(body.sessionId).toBe(sessionId);
    expect(body.userId).toBeNull();
  });

  it("refresh fails when session is missing", async () => {
    const res = await app.fetch(new Request("https://example.com/api/session/refresh", { method: "POST" }), env);
    expect(res.status).toBe(400);
  });

  it("refresh fails for invalid session", async () => {
    const res = await app.fetch(
      new Request("https://example.com/api/session/refresh", {
        method: "POST",
        headers: { cookie: "cq_session=unknown" }
      }),
      env
    );
    expect(res.status).toBe(401);
  });

  it("refresh reissues token and touches last_seen_at", async () => {
    const sessionId = "refresh-session";
    db.sessions.set(sessionId, {
      id: sessionId,
      user_id: "user-1",
      created_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      revoked: 0
    });

    const res = await app.fetch(
      new Request("https://example.com/api/session/refresh", {
        method: "POST",
        headers: { cookie: `cq_session=${sessionId}` }
      }),
      env
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBe(sessionId);
    expect(body.userId).toBe("user-1");

    const cookies = getCookies(res);
    expect(cookies.some((c) => c.startsWith("cq_access="))).toBe(true);

    const session = db.sessions.get(sessionId);
    expect(session?.last_seen_at).toBe(new Date().toISOString());
  });
});
