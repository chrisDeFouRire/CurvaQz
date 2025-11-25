import { describe, expect, it, vi } from "vitest";
import { getLeagues, getTeams } from "../src/lib/qz-api";
import type { WorkerEnv } from "../src/types/worker";

function createResponse<T>(data: T) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data)
  };
}

function createFetchMock<T>(data: T) {
  return vi.fn().mockResolvedValue(createResponse(data));
}

function createMemoryKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    async get(key: string, type?: "json") {
      const value = store.get(key);
      if (value === undefined) return null;
      if (type === "json") {
        return JSON.parse(value);
      }
      return value as unknown as string;
    },
    async put(key: string, value: string) {
      store.set(key, typeof value === "string" ? value : String(value));
    }
  } as unknown as KVNamespace;
}

function createWorkerEnv(fetchImpl: typeof fetch, cache?: KVNamespace): WorkerEnv {
  return {
    QUIZ_API_BASE: "https://clashui.inia.fr/api/quiz/",
    QUIZ_API_AUTH: "test-auth-token",
    fetch: fetchImpl,
    QZ_CACHE: cache
  } as WorkerEnv;
}

describe("qz-api caching", () => {
  it("uses KV cache for leagues when available", async () => {
    const leagues = [{ id: 1, name: "League 1" }];
    const fetchMock = createFetchMock(leagues);
    const cache = createMemoryKV();
    const env = createWorkerEnv(fetchMock as unknown as typeof fetch, cache);

    const first = await getLeagues(env);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).toEqual(leagues);

    fetchMock.mockClear();
    const second = await getLeagues(env);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(second).toEqual(leagues);
  });

  it("creates separate cache entries per league for teams", async () => {
    const teams = [{ team: { id: 1, name: "Team A" }, venue: { id: 10, name: "Venue" } }];
    const fetchMock = createFetchMock(teams);
    const cache = createMemoryKV();
    const env = createWorkerEnv(fetchMock as unknown as typeof fetch, cache);

    await getTeams(1, env);
    await getTeams(2, env);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    fetchMock.mockClear();
    await getTeams(1, env);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
