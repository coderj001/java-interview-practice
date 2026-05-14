# AI Configuration for Node-Native Review and Hinting

## Environment Variables

Set these before starting the web UI server:

```bash
export GEMINI_API_KEY=your_gemini_api_key_here
export OPENROUTER_API_KEY=your_openrouter_api_key_here
export OPENROUTER_MODEL=deepseek/deepseek-coder-v2
```

Notes:
- `GEMINI_API_KEY` enables the `gemini` provider.
- `OPENROUTER_API_KEY` enables the `openrouter` provider.
- `OPENROUTER_MODEL` is optional; if unset, `deepseek/deepseek-coder-v2` is used.

## Architecture

- Java remains responsible for challenge compilation and test evaluation.
- Node.js now handles AI review and hint requests directly with native `fetch`.
- Providers are detected at server startup from env vars and exposed as `availableProviders`.
- The UI provider dropdown and AI controls render only when at least one provider is available.

## API Routes

AI routes are challenge-scoped and unchanged in shape:

### Review

`POST /api/challenges/:challengeId/review`

Form fields:
- `provider` (`gemini` or `openrouter`)
- `code` (Java source)

Success response:

```json
{
  "provider": "gemini",
  "qualityAssessment": "...",
  "improvementSuggestion": "...",
  "followUpQuestions": ["...", "..."]
}
```

Provider unavailable response:

```json
{
  "error": "Provider not available: gemini"
}
```

(HTTP status `503`)

### Hint

`POST /api/challenges/:challengeId/hint`

Form fields:
- `provider` (`gemini` or `openrouter`)
- `code` (Java source)
- `currentLevel` (`"1"`, `"2"`, `"3"`, `"4"`, or empty)

Success response:

```json
{
  "provider": "openrouter",
  "level": "2",
  "nextLevel": "3",
  "hint": "..."
}
```

Level behavior:
- empty or invalid `currentLevel` is treated as `"1"`
- `"1" -> "2"`, `"2" -> "3"`, `"3" -> "4"`
- `"4" -> "max"`
