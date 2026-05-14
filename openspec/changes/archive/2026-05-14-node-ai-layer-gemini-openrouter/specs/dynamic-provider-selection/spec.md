## ADDED Requirements

### Requirement: Provider detection at startup
The system SHALL detect which AI providers are available by checking for the presence of their respective API key environment variables when the server starts.

#### Scenario: Gemini key present
- **WHEN** `GEMINI_API_KEY` is set in the environment at server startup
- **THEN** `gemini` is included in `availableProviders`

#### Scenario: OpenRouter key present
- **WHEN** `OPENROUTER_API_KEY` is set in the environment at server startup
- **THEN** `openrouter` is included in `availableProviders`

#### Scenario: No keys present
- **WHEN** neither `GEMINI_API_KEY` nor `OPENROUTER_API_KEY` is set
- **THEN** `availableProviders` is an empty array and no AI provider dropdown is rendered in the UI

### Requirement: Dynamic UI provider dropdown
The system SHALL render the AI provider dropdown in the UI using only the providers detected at server startup.

#### Scenario: Both providers available
- **WHEN** both `GEMINI_API_KEY` and `OPENROUTER_API_KEY` are set
- **THEN** the dropdown shows both "Gemini" and "OpenRouter" options

#### Scenario: Single provider available
- **WHEN** only one API key is set
- **THEN** the dropdown shows only that one provider (no broken options for unconfigured providers)

#### Scenario: Provider dropdown hidden
- **WHEN** `availableProviders` is empty
- **THEN** the AI provider dropdown and the Review / Next Hint buttons are hidden from the UI

### Requirement: Route-level provider validation
The system SHALL reject review and hint requests that specify a provider not in `availableProviders`.

#### Scenario: Invalid provider in request
- **WHEN** a POST to `/api/challenges/:id/review` or `/api/challenges/:id/hint` specifies a provider name not in `availableProviders`
- **THEN** the server returns HTTP 503 with `{ error: "Provider not available: <name>" }`
