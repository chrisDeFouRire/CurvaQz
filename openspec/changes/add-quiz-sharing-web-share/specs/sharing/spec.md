## ADDED Requirements
### Requirement: Share completed quiz via native controls
Players SHALL be able to share the quiz they just completed directly from the results screen using the Web Share API, with a copy-link fallback when native sharing is unavailable or fails. The share payload SHALL include a URL that embeds the current quiz id plus score/context text so friends can open the same quiz and compare on its leaderboard.

#### Scenario: Web Share is available
- **WHEN** a player finishes a quiz and views the results screen
- **THEN** a share control is visible alongside other post-quiz actions
- **WHEN** the player taps share on a device that supports the Web Share API
- **THEN** the native share sheet opens prefilled with a title/text referencing their score and a URL containing the current quiz id

#### Scenario: Friend opens a shared quiz link
- **WHEN** a friend opens a shared quiz URL that contains a quiz id
- **THEN** the quiz loads the same questions and leaderboard context tied to that quiz id instead of generating a new quiz

#### Scenario: Web Share not available or errors
- **WHEN** a player attempts to share on a browser that lacks Web Share support or the share call rejects
- **THEN** the app offers a copy-link fallback using the same quiz URL and shows a confirmation or error so the player knows whether the link was copied
