## 1. Gemini Adapter

- [x] 1.1 Create `web-ui/src/node/ai-gemini.js` with a `reviewCode(challenge, code, apiKey)` function that calls `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent` via native `fetch` and returns `{ qualityAssessment, improvementSuggestion, followUpQuestions }`
- [x] 1.2 Add a `hintCode(challenge, code, level, apiKey)` function to `ai-gemini.js` that calls the same Gemini endpoint with a hint-specific prompt and returns `{ level, nextLevel, hint }`
- [x] 1.3 Add prompt construction helpers in `ai-gemini.js`: `buildReviewPrompt(challenge, code)` and `buildHintPrompt(challenge, code, level)` that embed challenge title, method contract, prompt description, and user code in fenced blocks

## 2. OpenRouter Adapter

- [x] 2.1 Create `web-ui/src/node/ai-openrouter.js` with a `reviewCode(challenge, code, apiKey, model)` function that calls `https://openrouter.ai/api/v1/chat/completions` with a system + user message pair and parses the response into `{ qualityAssessment, improvementSuggestion, followUpQuestions }`
- [x] 2.2 Add a `hintCode(challenge, code, level, apiKey, model)` function to `ai-openrouter.js` using the same endpoint with a hint-specific system prompt and returns `{ level, nextLevel, hint }`
- [x] 2.3 Use `deepseek/deepseek-coder-v2` as the default model value; accept model as a parameter so `ai-provider.js` can pass `OPENROUTER_MODEL` override

## 3. Provider Dispatcher

- [x] 3.1 Create `web-ui/src/node/ai-provider.js` that reads `GEMINI_API_KEY` and `OPENROUTER_API_KEY` from `process.env` at module load time and exports a const `availableProviders` array (e.g. `["gemini", "openrouter"]`) containing only providers whose keys are present
- [x] 3.2 Export a `reviewCode(providerName, challenge, code)` function from `ai-provider.js` that validates `providerName` is in `availableProviders`, then delegates to the correct adapter; throws an error with message `"Provider not available: <name>"` if not
- [x] 3.3 Export a `hintCode(providerName, challenge, code, currentLevel)` function from `ai-provider.js` that does the same validation and delegates to the correct adapter's hint function
- [x] 3.4 Add level progression logic in `ai-provider.js`: levels are `"1"`, `"2"`, `"3"`, `"4"`; `nextLevel` for levels 1–3 is the next number string, for level 4 is `"max"`; empty/absent `currentLevel` maps to `"1"`

## 4. Server Integration

- [x] 4.1 In `web-ui/server.js`, import `{ availableProviders, reviewCode, hintCode }` from `./src/node/ai-provider.js`; remove the `reviewChallenge` and `nextHint` imports from `java-runtime.js`
- [x] 4.2 Update the `POST /api/challenges/:id/review` route in `server.js` to call `reviewCode(provider, challenge, code)` and return 503 with `{ error: "Provider not available: <name>" }` if the provider throws
- [x] 4.3 Update the `POST /api/challenges/:id/hint` route in `server.js` to call `hintCode(provider, challenge, code, currentLevel)` and handle the same 503 error case
- [x] 4.4 Pass `availableProviders` into the EJS template render call in the `GET /` route: `res.render("index", { challenges, initialChallenge, availableProviders, initialStateJson: ... })`

## 5. Template & UI

- [x] 5.1 In `web-ui/views/index.ejs`, replace the hardcoded `<option>` elements in the `#provider` `<select>` with an EJS loop over `availableProviders` rendering one `<option value="<%= p %>">` per entry
- [x] 5.2 Wrap the AI provider `<label>` and the Review / Next Hint buttons in a conditional `<% if (availableProviders.length > 0) { %>` block so they are hidden when no providers are configured

## 6. Cleanup & Docs

- [x] 6.1 Remove `reviewChallenge` and `nextHint` function definitions and their exports from `web-ui/src/node/java-runtime.js`
- [x] 6.2 Update `AI_CONFIG.md`: replace env var section with `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`; update architecture description to reflect Node-native AI layer; update API examples to match current route shapes
