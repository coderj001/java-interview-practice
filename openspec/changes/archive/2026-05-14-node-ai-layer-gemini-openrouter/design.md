## Context

The platform's AI review and hint features currently delegate to a Java CLI subprocess that instantiates `SimpleInterviewProvider` — returning hardcoded strings for all providers. The Java subprocess model (`spawnSync`) is well-suited for deterministic test evaluation but is a poor fit for outbound HTTP calls to external AI APIs: JVM startup latency, env-var scoping complexity, and verbose Java HTTP client code all add friction.

Node.js already owns the HTTP server layer and has native `fetch` (Node 18+), straightforward `process.env` access, and a thriving ecosystem. Moving AI calls to Node eliminates the subprocess round-trip for AI features while keeping Java responsible for what it does well: compiling and running Java test code.

## Goals / Non-Goals

**Goals:**
- Replace mocked Java AI calls with real Gemini and OpenRouter HTTP requests in Node.js
- Detect available providers at startup from env keys; surface only those to the UI
- Keep route signatures identical so browser JS (`app.js`) requires zero changes
- Use native Node `fetch` — no new npm dependencies
- Support `OPENROUTER_MODEL` override env var with a sensible default

**Non-Goals:**
- Removing Java AI classes (`SimpleInterviewProvider`, `ProviderRegistry`) — left as dead code
- Streaming responses — single-shot request/response only
- Caching or rate-limiting AI calls
- Supporting any providers beyond Gemini and OpenRouter in this change

## Decisions

### Decision 1: Raw fetch over SDK packages

**Chosen**: Native `fetch` for both Gemini and OpenRouter  
**Alternative**: `@google/generative-ai` + `openai` npm packages  
**Rationale**: The project currently has zero AI dependencies. Both APIs have stable, simple JSON endpoints. Native fetch keeps the dependency tree minimal and the Node version constraint (18+) is already implicit in the codebase. The SDK's main value (TypeScript types, retries, streaming) is not needed here.

### Decision 2: Provider detection at startup, not per-request

**Chosen**: Read `GEMINI_API_KEY` / `OPENROUTER_API_KEY` once at server startup; export a static `availableProviders` list  
**Alternative**: Check env vars on each request  
**Rationale**: Keys don't change at runtime. Startup detection makes the available providers easy to pass to the EJS template without per-request overhead. If a key is missing, the route handler returns a 400 rather than a silent mock fallback.

### Decision 3: Prompt built in Node from in-memory challenge data

**Chosen**: Build prompts using `challengesById` Map already loaded in `server.js` (title, prompt, methodContract, explanation)  
**Alternative**: Spawn a Java subprocess to fetch challenge context  
**Rationale**: The challenge catalog is already in memory after startup. No additional Java call needed. The context (title + method contract + prompt + user code) is sufficient for high-quality review and hints.

### Decision 4: Unified prompt builder, provider-specific sender

**Chosen**: `ai-provider.js` owns prompt construction; `ai-gemini.js` / `ai-openrouter.js` own HTTP dispatch  
**Alternative**: Each adapter builds its own prompt  
**Rationale**: Prompt quality is the same regardless of provider. Separating prompt construction from HTTP transport makes it easy to improve prompts without touching adapters, and easy to add providers without duplicating prompt logic.

### Decision 5: OpenRouter default model

**Chosen**: `deepseek/deepseek-coder-v2` as default, overridable via `OPENROUTER_MODEL`  
**Rationale**: Strong code review capability, freely available on OpenRouter. The env var override gives flexibility without a UI change.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| AI API latency (1–5s) blocks the Node event loop | `fetch` is async; route handlers are already `async` — no blocking |
| Prompt injection via user code | User code is wrapped in a fenced block in the prompt; no tool calls or function-calling APIs used |
| API key accidentally logged | Keys only read from `process.env`; never echo'd in logs or error responses |
| OpenRouter model availability changes | `OPENROUTER_MODEL` env override allows switching without code changes |
| No mock fallback for dev without keys | If neither key is set, `availableProviders` is empty; UI shows no AI dropdown; review/hint routes return 503 |

## Migration Plan

1. Add env vars to `.env` / shell: `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, optionally `OPENROUTER_MODEL`
2. Deploy new Node files (`ai-provider.js`, `ai-gemini.js`, `ai-openrouter.js`)
3. Update `server.js` and `index.ejs`
4. Remove `reviewChallenge`/`nextHint` from `java-runtime.js`
5. Restart server — provider detection runs at startup
6. Update `AI_CONFIG.md`

**Rollback**: Revert `server.js` to re-import `reviewChallenge`/`nextHint` from `java-runtime.js`. No database or persistent state changes.
