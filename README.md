# Java Interview Practice

Node-hosted Java interview practice workspace with an Express + EJS UI (`web-ui/`) and a containerized Java sandbox runtime (`sandbox-runtime/`).

## Prerequisites

- Node.js
- Docker or Podman
- Optional: Maven, if you want to run `mvn test`

## Startup

First-time setup:

```bash
npm install --prefix web-ui
```

Start sandbox runtime container:

```bash
docker compose -f docker-compose.sandbox.yml up --build -d
```

Verify sandbox is healthy:

```bash
curl http://127.0.0.1:7070/health
```

Start the web app:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Create an interview session (example):

```bash
curl -X POST http://127.0.0.1:3000/api/interview-sessions \
  -H "Content-Type: application/json" \
  -d '{"interviewerId":"interviewer","intervieweeId":"interviewee","challengeIds":["1","4"],"durationMs":1800000}'
```

`challengeIds` is required and must include at least one runnable challenge id. Interviewer can reassign the list only before the timer is started.

Open role-specific interfaces:

```text
http://127.0.0.1:3000/interviewer/<sessionId>
http://127.0.0.1:3000/interviewee/<sessionId>
```

Locked interview mode:

- Interviewee lands on a dedicated session home with assigned challenge list and statuses.
- Interviewee can open and code only on challenges already started by interviewer.
- Interviewer controls session and sees multi-select challenge assignment, per-challenge start controls, timer controls, and post-submit logs.
- Interviewer can add time with `+1`, `+5`, and `+10` minutes.
- Challenge list reassignment is blocked after session starts.
- Submission logs (status/code/output) are visible only to interviewer and only after submit.

Interviewer control APIs:

```bash
# assign challenge list before start
curl -X POST http://127.0.0.1:3000/api/interview-sessions/<sessionId>/challenges \
  -H "Content-Type: application/json" \
  -H "x-actor-id: interviewer" \
  -d '{"challengeIds":["1","24"]}'

# start one assigned challenge
curl -X POST http://127.0.0.1:3000/api/interview-sessions/<sessionId>/challenges/1/start \
  -H "Content-Type: application/json" \
  -H "x-actor-id: interviewer" \
  -d '{"actorId":"interviewer"}'

# read interviewer-visible submissions
curl -X GET "http://127.0.0.1:3000/api/interview-sessions/<sessionId>/submissions?actorId=interviewer" \
  -H "x-actor-id: interviewer"
```

Timer sync model:

- Server owns authoritative timer state and version.
- Clients fetch `/api/interview-sessions/:id/state` for bootstrap/reconnect.
- Clients subscribe to `/api/interview-sessions/:id/events` (SSE).
- Clients render local countdown between authoritative events.

Stop services:

```bash
docker compose -f docker-compose.sandbox.yml down
```

## Sandbox Environment Contract

Web UI runtime:

- `SANDBOX_RUNTIME_URL` (default: `http://127.0.0.1:7070`)
- `SANDBOX_JOB_TIMEOUT_MS` (default: `3000`)
- `SANDBOX_JOB_MEMORY_MB` (default: `128`)
- `SANDBOX_HTTP_TIMEOUT_MS` (default: `5000`)

Sandbox runtime policy:

- `SANDBOX_DEFAULT_NETWORK_MODE` (default: `none`)
- `SANDBOX_ALLOW_NETWORK_OVERRIDE` (default: `false`)
- `SANDBOX_ALLOWED_NETWORK_MODES` (default: `bridge`)
- `SANDBOX_MAX_TIMEOUT_MS` (default: `5000`)
- `SANDBOX_MAX_MEMORY_MB` (default: `256`)
- `SANDBOX_RUNNABLE_CHALLENGE_IDS` (default: `1,4,24`) - challenge IDs currently executable by Java sandbox runtime

## Verification

Run Node tests:

```bash
npm test
```

If Maven is installed, you can also run:

```bash
mvn test
```

## OpenSpec

This repo uses OpenSpec for change artifacts. The configured default workflow is in [openspec/config.yaml](/Users/raju/Develop/Personal/java-interview-practice/openspec/config.yaml:1).

When working with OpenSpec in this repo, use:

```bash
npx @fission-ai/openspec@latest
```

## LLM Prompts For `challenges.json`

Use these few-shot prompts in ChatGPT or Claude web. They are designed to return paste-ready JSON with the same structure used in this repo.

### Prompt A: Single Reflective Challenge (Few-Shot)

```text
You are generating ONE challenge object for challenges.json.

Rules:
1) Output ONLY one valid JSON object. No markdown. No explanation.
2) Keep fields exactly in this shape:
id, title, level, tags, details, methodContract, explanation, starterCode, testCases, sandboxProfile, aiTestConfig, hints, rules, resources, examples, notes, score, bestScore, attempts, timeSpentMs, completedAt, status
3) For reflective mode:
   - sandboxProfile.mode = "reflective"
   - testCases use fields: name, input, expected
4) methodContract must be parseable, like:
   - "int solve(int a, int b)"
   - "boolean solve(String token)"
   - "int solve(int[] values)"
5) starterCode must define public class Solution with matching solve(...) method.
6) Use status: "not-started", score: null, bestScore: 0, attempts: 0, timeSpentMs: 0, completedAt: null.

Few-shot example input:
- id: 120
- topic: palindrome-check-string
- level: beginner

Few-shot example output:
{
  "id": 120,
  "title": "Palindrome String Check",
  "level": "beginner",
  "tags": ["strings", "two-pointers"],
  "details": "Implement solve(String s) and return true if s is a palindrome when compared exactly (case-sensitive, spaces included).",
  "methodContract": "boolean solve(String s)",
  "explanation": "Compare characters from both ends moving inward.",
  "starterCode": "public class Solution {\n    public boolean solve(String s) {\n        return false;\n    }\n}\n",
  "testCases": [
    {"name": "simple palindrome", "input": ["racecar"], "expected": true},
    {"name": "simple non-palindrome", "input": ["hello"], "expected": false},
    {"name": "single char", "input": ["a"], "expected": true},
    {"name": "empty string", "input": [""], "expected": true},
    {"name": "case sensitive mismatch", "input": ["Aa"], "expected": false}
  ],
  "sandboxProfile": {"mode": "reflective", "timeoutMs": 3000},
  "aiTestConfig": {
    "promptTemplate": "Generate {count} additional test cases for `{methodContract}` palindrome validation. Return only JSON array with name/input/expected.",
    "defaultCount": 3
  },
  "hints": ["Use two pointers.", "Stop when pointers cross."],
  "rules": {"maxHintLevel": 2, "guidanceStyle": "direct"},
  "resources": [],
  "examples": ["racecar -> true", "hello -> false"],
  "notes": "",
  "score": null,
  "bestScore": 0,
  "attempts": 0,
  "timeSpentMs": 0,
  "completedAt": null,
  "status": "not-started"
}

Now generate a new challenge object with:
- id: {{ID}}
- topic: {{TOPIC}}
- level: {{beginner|intermediate|advanced}}
```

### Prompt B: Single Custom JUnit Harness Challenge (Few-Shot)

```text
You are generating ONE challenge object for challenges.json using custom junit harness mode.

Rules:
1) Output ONLY one valid JSON object. No markdown. No explanation.
2) Include all fields:
id, title, level, tags, details, methodContract, explanation, starterCode, testCases, sandboxProfile, hints, rules, resources, examples, notes, score, bestScore, attempts, timeSpentMs, completedAt, status
3) sandboxProfile must include:
   - mode: "custom_test"
   - runner: "junit"
   - timeoutMs
   - harnessClassName
   - harnessCode
4) harnessCode must be a complete Java class with JUnit 5 tests.
5) Keep testCases as placeholder since assertions are in harness.

Few-shot example output:
{
  "id": 121,
  "title": "Custom Echo Harness",
  "level": "beginner",
  "tags": ["custom-test", "junit"],
  "details": "Implement solve(String name) and return the same value.",
  "methodContract": "String solve(String name)",
  "explanation": "Return input unchanged.",
  "starterCode": "public class Solution {\n    public String solve(String name) {\n        return name;\n    }\n}\n",
  "testCases": [{"name": "placeholder", "input": ["alice"], "expected": "alice"}],
  "sandboxProfile": {
    "mode": "custom_test",
    "runner": "junit",
    "timeoutMs": 4000,
    "harnessClassName": "CustomEchoHarness",
    "harnessCode": "import org.junit.jupiter.api.Test;\nimport static org.junit.jupiter.api.Assertions.*;\n\npublic class CustomEchoHarness {\n    @Test\n    void echoesName() {\n        Solution s = new Solution();\n        assertEquals(\"alice\", s.solve(\"alice\"));\n    }\n}\n"
  },
  "hints": [],
  "rules": {"maxHintLevel": 1, "guidanceStyle": "direct"},
  "resources": [],
  "examples": [],
  "notes": "",
  "score": null,
  "bestScore": 0,
  "attempts": 0,
  "timeSpentMs": 0,
  "completedAt": null,
  "status": "not-started"
}

Now generate a new custom junit harness challenge with:
- id: {{ID}}
- topic: {{TOPIC}}
- level: {{beginner|intermediate|advanced}}
```

### Prompt C: Batch Generator (Mixed Types)

```text
Generate a JSON array of exactly {{COUNT}} challenge objects for challenges.json.

Hard constraints:
1) Output ONLY valid JSON array. No markdown.
2) Unique numeric id for each object.
3) Include all fields used by this repo:
   id, title, level, tags, details, methodContract, explanation, starterCode, testCases, sandboxProfile, hints, rules, resources, examples, notes, score, bestScore, attempts, timeSpentMs, completedAt, status
4) Distribution:
   - at least 60% reflective
   - remaining custom_test junit
5) For reflective entries: sandboxProfile.mode="reflective", testCases use name/input/expected.
6) For custom_test entries: sandboxProfile.mode="custom_test", runner="junit", include harnessClassName + harnessCode.
7) Initialize lifecycle fields as:
   score=null, bestScore=0, attempts=0, timeSpentMs=0, completedAt=null, status="not-started".
8) methodContract must be parseable and consistent with starterCode.
```
