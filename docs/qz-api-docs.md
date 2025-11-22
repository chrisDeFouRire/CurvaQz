# Quiz API (clashui.inia.fr)

Base: `https://clashui.inia.fr/api/quiz`

Authentication: **Basic Auth** on all endpoints.

---

## Leagues

- **GET** `/leagues`
- Returns: array of supported leagues.
- Example item:
  ```json
  {
    "id": "<leagueID>",
    "name": "<league name>"
  }
  ```

## Teams

- **GET** `/teams`
- Query: `league` (required) — league ID.
- Returns: teams for the given league.

## Fixtures (last 10)

- **GET** `/fixtures`
- Query:
  - `league` (required) — league ID.
  - `team` (optional) — filter by team ID.
- Returns: last 10 fixtures for the league (optionally filtered by team).

## Fixtures (last 50)

- **GET** `/fixtures_50`
- Query:
  - `league` (required) — league ID.
  - `team` (optional) — filter by team ID.
- Returns: last 50 fixtures for the league (optionally filtered by team).

## Quiz by Fixture

- **GET** `/quiz`
- Query:
  - `distinct` — `1` for single questions, `0` to allow repeats.
  - `shuffle` — `1` to randomize answer order, `0` to keep first as correct.
  - `length` — desired number of questions.
  - `fixture` — fixture ID.
  - `nbAnswers` — number of answers per question.
  - `lang` — `fr` | `en` | `es` | `de`.
- Returns: a quiz for the specified fixture.

## Quiz by Latest Fixture in League

- **GET** `/last`
- Query:
  - `distinct` — `1` for single questions, `0` to allow repeats.
  - `shuffle` — `1` to randomize answer order, `0` to keep first as correct.
  - `length` — desired number of questions.
  - `league` — league ID.
  - `nbAnswers` — number of answers per question.
  - `lang` — `fr` | `en` | `es` | `de`.
- Returns: a quiz for the most recent fixture in the specified league.

## Prompt to have AI enrich it later

I want you to write integration tests for lib/qz-api.ts using curvaQz/docs/qz-api-docs.md to understand what to test. I want you to actually test the API, its return values, infer the types in the responses, and enrich your understanding of the API through this testing. You'll add documentation to the docs/qz-api-docs.md and types to the src/lib/qz-api.ts as you discover them from the actual usage.
