const DEFAULT_BASE_URL = "https://clashui.inia.fr/api/quiz/";

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

export type QzApiConfig = {
  baseUrl?: string;
  authToken?: string;
  fetchImpl?: typeof fetch;
};

type QueryParams = Record<string, string | number | undefined>;

function toNumericFlag(value: boolean | number | undefined): number | undefined {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  return undefined;
}

async function request<T>(
  path: string,
  params: QueryParams,
  config: QzApiConfig = {}
): Promise<T> {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const fetchFn = config.fetchImpl ?? fetch;
  const url = new URL(path, baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = {};
  if (config.authToken) {
    headers.Authorization = `Basic ${config.authToken}`;
  }

  const response = await fetchFn(url.toString(), { headers });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`QZ API "${path}" failed (${response.status}): ${body || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function getLeagues(config?: QzApiConfig): Promise<League[]> {
  return request<League[]>("leagues", {}, config);
}

export async function getTeams(
  leagueId: string | number,
  config?: QzApiConfig
): Promise<Team[]> {
  return request<Team[]>("teams", { league: leagueId }, config);
}

export async function getFixtures(
  leagueId: string | number,
  teamId?: string | number,
  config?: QzApiConfig
): Promise<Fixture[]> {
  return request<Fixture[]>("fixtures", { league: leagueId, team: teamId }, config);
}

export async function getFixtures50(
  leagueId: string | number,
  teamId?: string | number,
  config?: QzApiConfig
): Promise<Fixture[]> {
  return request<Fixture[]>("fixtures_50", { league: leagueId, team: teamId }, config);
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
  config?: QzApiConfig
): Promise<T> {
  const query: QueryParams = {
    fixture: params.fixtureId,
    length: params.length,
    nbAnswers: params.nbAnswers,
    distinct: toNumericFlag(params.distinct),
    shuffle: toNumericFlag(params.shuffle),
    lang: params.lang
  };

  return request<T>("quiz", query, config);
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
  config?: QzApiConfig
): Promise<T> {
  const query: QueryParams = {
    league: params.leagueId,
    length: params.length,
    nbAnswers: params.nbAnswers,
    distinct: toNumericFlag(params.distinct),
    shuffle: toNumericFlag(params.shuffle),
    lang: params.lang
  };

  return request<T>("last", query, config);
}
