import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getLeagues,
  getTeams,
  getFixtures,
  getFixtures50,
  getQuizByFixture,
  getQuizByLatestFixture,
  type QzApiConfig,
  type League,
  type Team,
  type Fixture
} from "../src/lib/qz-api";

// Load environment variables for integration tests
const QUIZ_API_BASE = process.env.QUIZ_API_BASE || "https://clashui.inia.fr/api/quiz/";
const QUIZ_API_AUTH = process.env.QUIZ_API_AUTH;

const apiConfig: QzApiConfig = {
  baseUrl: QUIZ_API_BASE,
  authToken: QUIZ_API_AUTH
};

// Skip integration tests if auth is not configured
const shouldRunIntegration = Boolean(QUIZ_API_AUTH);

describe("QZ API Integration Tests", () => {
  // Mock fetch for unit tests, but use real fetch for integration
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Use real fetch for integration tests
    if (shouldRunIntegration) {
      global.fetch = originalFetch;
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("Leagues", () => {
    it("should fetch leagues successfully", async () => {
      if (!shouldRunIntegration) {
        console.warn("Skipping integration test: QUIZ_API_AUTH not set");
        return;
      }

      const leagues = await getLeagues(apiConfig);
      console.log("Leagues response:", JSON.stringify(leagues, null, 2));

      expect(Array.isArray(leagues)).toBe(true);
      expect(leagues.length).toBeGreaterThan(0);

      // Infer and validate types
      leagues.forEach((league: League) => {
        expect(typeof league.id).toBe("string");
        expect(typeof league.name).toBe("string");
        expect(league.name).toBeTruthy();
      });
    });
  });

  describe("Teams", () => {
    it("should fetch teams for a league", async () => {
      if (!shouldRunIntegration) return;

      // First get a league
      const leagues = await getLeagues(apiConfig);
      expect(leagues.length).toBeGreaterThan(0);
      const leagueId = leagues[0].id;

      const teams = await getTeams(leagueId, apiConfig);
      console.log("Teams response:", JSON.stringify(teams, null, 2));

      expect(Array.isArray(teams)).toBe(true);

      // Infer and validate types
      teams.forEach((team: Team) => {
        expect(typeof team.id).toBe("string");
        expect(typeof team.name).toBe("string");
        expect(team.name).toBeTruthy();
      });
    });
  });

  describe("Fixtures", () => {
    it("should fetch last 10 fixtures", async () => {
      if (!shouldRunIntegration) return;

      const leagues = await getLeagues(apiConfig);
      const leagueId = leagues[0].id;

      const fixtures = await getFixtures(leagueId, undefined, apiConfig);
      console.log("Fixtures response:", JSON.stringify(fixtures, null, 2));

      expect(Array.isArray(fixtures)).toBe(true);

      // Infer types from actual response
      fixtures.forEach((fixture: Fixture) => {
        expect(typeof fixture).toBe("object");
        // Log structure for type inference
        console.log("Fixture keys:", Object.keys(fixture));
      });
    });

    it("should fetch last 50 fixtures", async () => {
      if (!shouldRunIntegration) return;

      const leagues = await getLeagues(apiConfig);
      const leagueId = leagues[0].id;

      const fixtures = await getFixtures50(leagueId, undefined, apiConfig);
      console.log("Fixtures50 response:", JSON.stringify(fixtures.slice(0, 2), null, 2)); // Log first 2

      expect(Array.isArray(fixtures)).toBe(true);
      expect(fixtures.length).toBeGreaterThanOrEqual(10); // Should have more than basic fixtures
    });
  });

  describe("Quiz Generation", () => {
    it("should generate quiz by latest fixture", async () => {
      if (!shouldRunIntegration) return;

      const leagues = await getLeagues(apiConfig);
      const leagueId = leagues[0].id;

      const quiz = await getQuizByLatestFixture({
        leagueId,
        length: 5,
        nbAnswers: 4,
        distinct: true,
        shuffle: true,
        lang: "en"
      }, apiConfig);

      console.log("Quiz by latest response:", JSON.stringify(quiz, null, 2));

      expect(typeof quiz).toBe("object");

      // Infer QuizResponse type
      if (quiz && typeof quiz === "object") {
        console.log("Quiz keys:", Object.keys(quiz));
        if ("questions" in quiz) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.log("Questions sample:", JSON.stringify((quiz as any).questions?.[0], null, 2));
        }
      }
    });

    it("should generate quiz by specific fixture", async () => {
      if (!shouldRunIntegration) return;

      const leagues = await getLeagues(apiConfig);
      const leagueId = leagues[0].id;

      const fixtures = await getFixtures(leagueId, undefined, apiConfig);
      expect(fixtures.length).toBeGreaterThan(0);
      const fixtureId = fixtures[0].id;

      const quiz = await getQuizByFixture({
        fixtureId,
        length: 5,
        nbAnswers: 4,
        distinct: true,
        shuffle: true,
        lang: "en"
      }, apiConfig);

      console.log("Quiz by fixture response:", JSON.stringify(quiz, null, 2));

      expect(typeof quiz).toBe("object");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid auth", async () => {
      const badConfig: QzApiConfig = {
        ...apiConfig,
        authToken: "invalid"
      };

      await expect(getLeagues(badConfig)).rejects.toThrow(/404/);
    });

    it("should handle invalid league ID", async () => {
      if (!shouldRunIntegration) return;

      await expect(getTeams("invalid-league", apiConfig)).rejects.toThrow();
    });
  });
});