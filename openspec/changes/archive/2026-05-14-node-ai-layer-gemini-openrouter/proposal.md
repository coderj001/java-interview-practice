## Why

The current AI review and hint system is entirely mocked — all three registered providers (Gemini, OpenAI, Claude) return identical hardcoded strings regardless of the user's code or challenge context. Real AI-powered code review and hints require moving the AI integration to the Node.js layer, where native fetch, environment variables, and provider SDKs are readily available without JVM subprocess overhead.

## What Changes

- **NEW**: `web-ui/src/node/ai-provider.js` — startup-time provider detection; reads env keys and exports `availableProviders[]` and a unified `callAI(provider, prompt)` function
- **NEW**: `web-ui/src/node/ai-gemini.js` — Gemini API adapter using raw fetch (`generativelanguage.googleapis.com`)
- **NEW**: `web-ui/src/node/ai-openrouter.js` — OpenRouter adapter using raw fetch (OpenAI-compatible `chat/completions` endpoint)
- **MODIFIED**: `web-ui/server.js` — replace `reviewChallenge()` and `nextHint()` Java calls with Node AI calls; pass `availableProviders` to EJS template
- **MODIFIED**: `web-ui/views/index.ejs` — render AI provider dropdown dynamically from server-provided list (only shows providers with configured API keys)
- **MODIFIED**: `web-ui/src/node/java-runtime.js` — remove `reviewChallenge` and `nextHint` exports (evaluation and listing remain)
- **MODIFIED**: `AI_CONFIG.md` — update env vars, architecture description, and API examples to reflect the new Node-native AI layer

## Capabilities

### New Capabilities

- `node-ai-review`: Real AI-powered code review — sends challenge context + user code to Gemini or OpenRouter, returns `qualityAssessment`, `improvementSuggestion`, and `followUpQuestions`
- `node-ai-hint`: Real AI-powered progressive hints — sends challenge context + current code + hint level to Gemini or OpenRouter, returns level-appropriate hint text
- `dynamic-provider-selection`: Server detects available providers at startup from env keys; UI dropdown is populated dynamically — users only see providers they have keys for

### Modified Capabilities

- none

## Impact

**Code**
- `web-ui/src/node/java-runtime.js`: `reviewChallenge`, `nextHint` functions removed
- `web-ui/server.js`: two route handlers updated, template data extended
- `web-ui/views/index.ejs`: dropdown rendered from dynamic list
- Java AI classes (`SimpleInterviewProvider`, `ProviderRegistry`) left in place — not removed, not used

**Environment Variables**
```
GEMINI_API_KEY=...                          # enables gemini provider
OPENROUTER_API_KEY=...                      # enables openrouter provider  
OPENROUTER_MODEL=deepseek/deepseek-coder-v2 # optional, default provided
```

**Dependencies**: No new npm packages — uses Node 18+ native `fetch`

**APIs**: Route shapes unchanged (`/api/challenges/:id/review`, `/api/challenges/:id/hint`) — browser JS (`app.js`) requires no changes
