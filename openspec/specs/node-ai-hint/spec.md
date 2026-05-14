## Purpose

TBD

## Requirements

### Requirement: AI hint via Gemini
The system SHALL call the Gemini API with a prompt that includes the challenge context, user's current code, and requested hint level when the Gemini provider is selected.

#### Scenario: Successful Gemini hint
- **WHEN** a POST to `/api/challenges/:id/hint` is made with `provider=gemini`, a valid `currentLevel`, and `GEMINI_API_KEY` is configured
- **THEN** the server returns `{ provider, level, nextLevel, hint }` with a real AI-generated hint appropriate to the level

#### Scenario: First hint request (no current level)
- **WHEN** a POST to `/api/challenges/:id/hint` is made with an empty or absent `currentLevel`
- **THEN** the server treats this as level 1 and returns a subtle, non-revealing hint

### Requirement: AI hint via OpenRouter
The system SHALL call the OpenRouter `chat/completions` endpoint for hint generation when the OpenRouter provider is selected.

#### Scenario: Successful OpenRouter hint
- **WHEN** a POST to `/api/challenges/:id/hint` is made with `provider=openrouter` and `OPENROUTER_API_KEY` is configured
- **THEN** the server calls OpenRouter and returns `{ provider, level, nextLevel, hint }` with real AI content

### Requirement: Progressive hint levels
The system SHALL support four hint levels (1 through 4) with increasing specificity, and report `nextLevel` so the client can advance the progression.

#### Scenario: Level progression
- **WHEN** a hint response is returned at level N where N < 4
- **THEN** `nextLevel` is set to level N+1

#### Scenario: Final hint level
- **WHEN** a hint response is returned at level 4
- **THEN** `nextLevel` is set to `"max"` indicating no further hints are available

### Requirement: Consistent hint response shape
The system SHALL return the same JSON shape for hints regardless of provider, matching the existing contract consumed by `app.js`.

#### Scenario: Response shape preserved
- **WHEN** a successful hint response is returned from any provider
- **THEN** the JSON contains exactly: `provider` (string), `level` (string), `nextLevel` (string), `hint` (string)
