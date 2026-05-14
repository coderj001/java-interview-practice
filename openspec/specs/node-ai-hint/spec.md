## Purpose

TBD
## Requirements
### Requirement: AI hint via Gemini
The system SHALL call the Gemini API with a prompt that includes the global system prompt from `system-prompt.md`, the challenge context, per-challenge hints array, per-challenge rules, user's current code, and requested hint level when the Gemini provider is selected.

#### Scenario: Successful Gemini hint with system prompt
- **WHEN** a POST to `/api/challenges/:id/hint` is made with `provider=gemini`, a valid `currentLevel`, and `GEMINI_API_KEY` is configured
- **THEN** the server includes the global system prompt and challenge-specific hints/rules in the API call and returns `{ provider, level, nextLevel, hint }`

#### Scenario: First hint request (no current level)
- **WHEN** a POST to `/api/challenges/:id/hint` is made with an empty or absent `currentLevel`
- **THEN** the server treats this as level 1 and returns a subtle, non-revealing hint

### Requirement: AI hint via OpenRouter
The system SHALL call the OpenRouter `chat/completions` endpoint for hint generation when the OpenRouter provider is selected, including the global system prompt and per-challenge context.

#### Scenario: Successful OpenRouter hint with system prompt
- **WHEN** a POST to `/api/challenges/:id/hint` is made with `provider=openrouter` and `OPENROUTER_API_KEY` is configured
- **THEN** the server includes the global system prompt and challenge-specific hints/rules in the API call and returns `{ provider, level, nextLevel, hint }`

### Requirement: Progressive hint levels with per-challenge rules
The system SHALL support configurable hint levels per challenge via the `rules.maxHintLevel` field, and report `nextLevel` so the client can advance the progression.

#### Scenario: Level progression within rules
- **WHEN** a hint response is returned at level N where N is less than the challenge's maxHintLevel
- **THEN** `nextLevel` is set to level N+1

#### Scenario: Final hint level per challenge rules
- **WHEN** a hint response is returned at the challenge's maxHintLevel
- **THEN** `nextLevel` is set to `"max"` indicating no further hints are available

### Requirement: Consistent hint response shape
The system SHALL return the same JSON shape for hints regardless of provider, matching the existing contract consumed by `app.js`.

#### Scenario: Response shape preserved
- **WHEN** a successful hint response is returned from any provider
- **THEN** the JSON contains exactly: `provider` (string), `level` (string), `nextLevel` (string), `hint` (string)

