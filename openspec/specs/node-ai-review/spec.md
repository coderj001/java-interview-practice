## Purpose

TBD
## Requirements
### Requirement: AI review via Gemini
The system SHALL call the Gemini `generateContent` API with the global system prompt from `system-prompt.md`, the challenge title, method contract, challenge details, and user's source code when the Gemini provider is selected and `GEMINI_API_KEY` is set.

#### Scenario: Successful Gemini review with system prompt
- **WHEN** a POST to `/api/challenges/:id/review` is made with `provider=gemini` and `GEMINI_API_KEY` is configured
- **THEN** the server includes the global system prompt in the Gemini API call and returns `{ provider, qualityAssessment, improvementSuggestion, followUpQuestions }`

#### Scenario: Gemini key not configured
- **WHEN** a POST to `/api/challenges/:id/review` is made with `provider=gemini` and `GEMINI_API_KEY` is not set
- **THEN** the server returns HTTP 503 with `{ error: "Provider not available: gemini" }`

### Requirement: AI review via OpenRouter
The system SHALL call the OpenRouter `chat/completions` endpoint with the global system prompt and user message when the OpenRouter provider is selected and `OPENROUTER_API_KEY` is set.

#### Scenario: Successful OpenRouter review with system prompt
- **WHEN** a POST to `/api/challenges/:id/review` is made with `provider=openrouter` and `OPENROUTER_API_KEY` is configured
- **THEN** the server includes the global system prompt in the OpenRouter call and returns `{ provider, qualityAssessment, improvementSuggestion, followUpQuestions }`

#### Scenario: OpenRouter model override
- **WHEN** `OPENROUTER_MODEL` env var is set
- **THEN** the server uses that model string in the OpenRouter request instead of the default

#### Scenario: OpenRouter key not configured
- **WHEN** a POST to `/api/challenges/:id/review` is made with `provider=openrouter` and `OPENROUTER_API_KEY` is not set
- **THEN** the server returns HTTP 503 with `{ error: "Provider not available: openrouter" }`

### Requirement: Consistent review response shape
The system SHALL return the same JSON shape for review regardless of provider, matching the existing contract consumed by `app.js`.

#### Scenario: Response shape preserved
- **WHEN** a successful review response is returned from any provider
- **THEN** the JSON contains exactly: `provider` (string), `qualityAssessment` (string), `improvementSuggestion` (string), `followUpQuestions` (array of strings)

