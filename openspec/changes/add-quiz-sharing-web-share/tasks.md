## 1. Implementation

- [x] 1.1 Add shareable quiz URL generation on results (uses quiz id + current origin) and helper to format share payload.
- [x] 1.2 Implement Web Share API flow with graceful fallback to copy link plus user feedback.
- [x] 1.3 Add share CTA to the results screen near leaderboard/play-again controls with loading/error states.
- [x] 1.4 Persist quiz payloads and expose an endpoint to load a quiz by id so shared links replay the same quiz.
- [x] 1.5 Update the play flow to detect `quizId` in the URL and load that quiz instead of generating a new one.

## 2. Validation

- [x] 2.1 Manual test on a modern mobile/desktop browser with Web Share support (successful share with score + URL).
- [x] 2.2 Manual test on a browser without Web Share support (copy-to-clipboard fallback with confirmation).
- [x] 2.3 Verify share URL opens and replays the same quiz/leaderboard context for the shared quiz id.
