import type { WorkerEnv } from "@/types/worker";

const DEFAULT_BASE_URL = "https://clashui.inia.fr/api/quiz/";
export const DEFAULT_QZ_API_CACHE_TTL_SECONDS = 3600;

declare const QZ_API_CACHE_TTL_SECONDS: string | undefined;

type LanguageCode = "fr" | "en" | "es" | "de";

// Inferred types from API integration tests
export type League = {
  id: number;
  name: string;
  [key: string]: unknown; // Allow additional fields
};

export type TeamInfo = {
  id: number;
  name: string;
  code?: string;
  country?: string;
  founded?: number;
  national?: boolean;
  logo?: string;
  [key: string]: unknown;
};

export type VenueInfo = {
  id: number;
  name: string;
  address?: string;
  city?: string;
  capacity?: number;
  surface?: string;
  image?: string;
  [key: string]: unknown;
};

export type Team = {
  team: TeamInfo;
  venue: VenueInfo;
  [key: string]: unknown;
};

export type FixtureInfo = {
  id: number;
  referee?: string;
  timezone?: string;
  date?: string;
  timestamp?: number;
  periods?: {
    first?: number;
    second?: number;
  };
  venue?: VenueInfo;
  status?: {
    long?: string;
    short?: string;
    elapsed?: number;
  };
  [key: string]: unknown;
};

export type Fixture = {
  fixture: FixtureInfo;
  league?: {
    id?: number;
    name?: string;
    country?: string;
    logo?: string;
    flag?: string;
    season?: number;
    round?: string;
  };
  teams?: {
    home?: TeamInfo;
    away?: TeamInfo;
  };
  goals?: {
    home?: number;
    away?: number;
  };
  score?: {
    halftime?: {
      home?: number;
      away?: number;
    };
    fulltime?: {
      home?: number;
      away?: number;
    };
    extratime?: {
      home?: number;
      away?: number;
    };
    penalty?: {
      home?: number;
      away?: number;
    };
  };
  [key: string]: unknown;
};

export type Answer = string | {
  text?: string;
  isCorrect?: boolean;
  correct?: boolean;
  // Actual API format
  type?: "OK" | "BAD";
  txt?: string;
  [key: string]: unknown;
};

export type Question = {
  question?: string;
  prompt?: string;
  answers?: Answer[];
  options?: Answer[];
  correct_answer?: string;
  incorrect_answers?: string[];
  correctAnswer?: string;
  incorrectAnswers?: string[];
  // Actual API format - this is what we get from the quiz endpoint
  [key: string]: unknown; // Allow additional fields
};

// Individual quiz question from API (with numeric key)
export type QuizQuestion = {
  question: string;
  answers: Array<{
    type: "OK" | "BAD";
    txt: string;
  }>;
  [key: string]: unknown;
};

export type QuizResponse = {
  // API returns questions as properties with numeric string keys: "0", "1", "2", etc.
  [key: string]: QuizQuestion | Fixture | undefined;
  // Special key for fixture data
  fixture?: Fixture;
};

type QueryParams = Record<string, string | number | undefined>;

function toNumericFlag(value: boolean | number | undefined): number | undefined {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  return undefined;
}


function resolveCacheTtlSeconds(): number {
  const raw = typeof QZ_API_CACHE_TTL_SECONDS !== "undefined"
    ? QZ_API_CACHE_TTL_SECONDS
    : (globalThis as Record<string, unknown>).QZ_API_CACHE_TTL_SECONDS;
  const parsed = typeof raw === "string" ? Number(raw) : Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_QZ_API_CACHE_TTL_SECONDS;
  }
  return Math.floor(parsed);
}

async function request<T>(
  path: string,
  params: QueryParams,
  env: WorkerEnv
): Promise<T> {
  const baseUrl = env.QUIZ_API_BASE ?? DEFAULT_BASE_URL;
  const fetchFn = env.fetch ?? fetch;
  const url = new URL(path, baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = {};
  headers.Authorization = `Basic ${env.QUIZ_API_AUTH}`;

  console.log("qz-api.request", {
    url: url.toString(),
    path
  });

  const response = await fetchFn(url.toString(), { headers });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`QZ API "${path}" failed (${response.status}): ${body || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

async function readCache<T>(cache: KVNamespace | undefined, key: string): Promise<T | null> {
  if (!cache) return null;
  try {
    const cached = await cache.get<T>(key, "json");
    return cached as T | null;
  } catch (error) {
    console.warn("qz-api.cache.read_failed", {
      key,
      message: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

async function writeCache<T>(
  cache: KVNamespace | undefined,
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  if (!cache) return;
  try {
    await cache.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
  } catch (error) {
    console.warn("qz-api.cache.write_failed", {
      key,
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

async function fetchWithCache<T>(
  cacheKey: string,
  env: WorkerEnv,
  fetcher: () => Promise<T>
): Promise<T> {
  const cache = env.QZ_CACHE;
  const cached = await readCache<T>(cache, cacheKey);
  if (cached !== null) {
    return cached;
  }

  const value = await fetcher();
  if (typeof value !== "undefined") {
    await writeCache(cache, cacheKey, value, resolveCacheTtlSeconds());
  }
  return value;
}

export async function getLeagues(env: WorkerEnv): Promise<League[]> {
  return fetchWithCache<League[]>("qz:leagues", env, () => request<League[]>("leagues", {}, env));
}

export async function getTeams(
  leagueId: string | number,
  env: WorkerEnv
): Promise<Team[]> {
  const cacheKey = `qz:teams:${leagueId}`;
  return fetchWithCache<Team[]>(cacheKey, env, () =>
    request<Team[]>("teams", { league: leagueId }, env)
  );
}

export async function getFixtures(
  leagueId: string | number,
  env: WorkerEnv,
  teamId?: string | number,
): Promise<Fixture[]> {
  return request<Fixture[]>("fixtures", { league: leagueId, team: teamId }, env);
}

export async function getFixtures50(
  leagueId: string | number,
  env: WorkerEnv,
  teamId?: string | number,
): Promise<Fixture[]> {
  return request<Fixture[]>("fixtures_50", { league: leagueId, team: teamId }, env);
}

export type QuizByFixtureParams = {
  fixtureId: string | number;
  length?: number;
  nbAnswers?: number;
  distinct?: boolean | number;
  shuffle?: boolean | number;
  lang?: LanguageCode;
};

export async function getQuizByFixture<T = QuizResponse>(
  params: QuizByFixtureParams,
  env: WorkerEnv
): Promise<T> {
  const query: QueryParams = {
    fixture: params.fixtureId,
    length: params.length,
    nbAnswers: params.nbAnswers,
    distinct: toNumericFlag(params.distinct),
    shuffle: toNumericFlag(params.shuffle),
    lang: params.lang
  };

  return request<T>("quiz", query, env);
}

export type QuizByLatestParams = {
  leagueId: string | number;
  length?: number;
  nbAnswers?: number;
  distinct?: boolean | number;
  shuffle?: boolean | number;
  lang?: LanguageCode;
};

export async function getQuizByLatestFixture<T = QuizResponse>(
  params: QuizByLatestParams,
  env: WorkerEnv
): Promise<T> {
  const query: QueryParams = {
    league: params.leagueId,
    length: params.length,
    nbAnswers: params.nbAnswers,
    distinct: toNumericFlag(params.distinct),
    shuffle: toNumericFlag(params.shuffle),
    lang: params.lang
  };

  return request<T>("last", query, env);
}
