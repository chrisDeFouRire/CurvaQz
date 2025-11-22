## Why
Players currently finish a quiz without an easy way to invite friends to take the same quiz or compare scores. We need a share action at the results stage that promotes virality and uses the native Web Share API for a smooth mobile experience.

## What Changes
- Add a post-quiz share button that triggers the Web Share API with quiz URL, title, and score context; include a copy-link fallback when the API is unavailable or errors.
- Generate a shareable quiz URL tied to the current quiz id so friends can open the same quiz/leaderboard.
- Wire the share control into the results screen alongside the leaderboard and play-again actions.

## Impact
- Affected specs: sharing
- Affected code: Quiz results UI (`src/components/QuizResults.tsx`), quiz/play routing logic for shareable URLs, optional helpers for share text/copy fallback
