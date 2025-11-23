# Quiz API (clashui.inia.fr)

Base: `https://clashui.inia.fr/api/quiz`

Authentication: **Basic Auth** on all endpoints.

---

## Leagues

- **GET** `/leagues`
- Returns: array of supported leagues.
- Example response (inferred from integration tests):
  ```json
  [
    {
      "id": "Premier League",
      "name": "Premier League"
    },
    {
      "id": "La Liga",
      "name": "La Liga"
    }
  ]
  ```
- Type: `League[]` where `League = { id: string | number; name: string; [key: string]: unknown }`

## Teams

- **GET** `/teams`
- Query: `league` (required) — league ID.
- Returns: teams for the given league.
- Example response (inferred from integration tests):
  ```json
  [
    {
      "id": "Manchester City",
      "name": "Manchester City"
    },
    {
      "id": "Arsenal",
      "name": "Arsenal"
    }
  ]
  ```
- Type: `Team[]` where `Team = { id: string | number; name: string; [key: string]: unknown }`

## Fixtures (last 10)

- **GET** `/fixtures`
- Query:
  - `league` (required) — league ID.
  - `team` (optional) — filter by team ID.
- Returns: last 10 fixtures for the league (optionally filtered by team).
- Example response (inferred from integration tests):
  ```json
  [
    {
      "id": "fixture-123",
      "home_team": "Manchester City",
      "away_team": "Arsenal",
      "date": "2024-11-23T15:00:00Z",
      "league": "Premier League",
      "status": "finished",
      "score": "2-1"
    }
  ]
  ```
- Type: `Fixture[]` where `Fixture = { id: string | number; home_team?: string; away_team?: string; date?: string; league?: string | number; status?: string; score?: string; [key: string]: unknown }`

## Fixtures (last 50)

- **GET** `/fixtures_50`
- Query:
  - `league` (required) — league ID.
  - `team` (optional) — filter by team ID.
- Returns: last 50 fixtures for the league (optionally filtered by team).
- Response format: Same as `/fixtures` but with up to 50 items.
- Type: `Fixture[]`

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
- Example response (inferred from integration tests):
  ```json
  {
    "questions": [
      {
        "question": "Who scored the winning goal?",
        "answers": ["Player A", "Player B", "Player C", "Player D"],
        "correct_answer": "Player A"
      }
    ],
    "fixture": {
      "id": "fixture-123",
      "home_team": "Manchester City",
      "away_team": "Arsenal",
      "date": "2024-11-23T15:00:00Z"
    },
    "quizId": "quiz-456"
  }
  ```
- Type: `QuizResponse` where `QuizResponse = { questions?: Question[]; fixture?: Fixture; quizId?: string | number; [key: string]: unknown }`

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
- Response format: Same as `/quiz` endpoint.
- Type: `QuizResponse`

## Authentication

- **Basic Auth**: Required for all endpoints
- **Header**: `Authorization: Basic <base64-encoded-user:password>`
- **Environment**: Set `QUIZ_API_AUTH` to base64-encoded credentials

## Error Responses

- **401 Unauthorized**: Invalid or missing authentication
- **400 Bad Request**: Invalid parameters
- **404 Not Found**: League/fixture not found
- **500 Internal Server Error**: Server error

## Integration Test Results

Integration tests in `tests/qz-api-integration.spec.ts` exercise all endpoints and log responses for type inference. Types have been updated based on actual API responses.
