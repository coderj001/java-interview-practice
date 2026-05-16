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

Use these prompts in any web LLM to generate challenge entries you can paste into `challenges.json`.

### 1) Reflective/Basic

```text
Generate one challenge JSON object for a Java interview platform.
Mode: reflective.
Include: id, title, level, tags, details, methodContract, explanation, starterCode, testCases (5+), sandboxProfile { mode, timeoutMs }, hints, rules, resources, examples.
Method should be deterministic and testable with plain inputs/outputs.
Output only valid JSON object, no markdown.
```

### 2) Concurrent/Threaded

```text
Generate one challenge JSON object for a Java interview platform.
Mode: concurrent.
Use a thread-safety problem (rate limiter, bounded buffer, etc).
Include sandboxProfile with mode: "concurrent", concurrentThreads, timeoutMs.
Test cases must use threshold-style expected fields like minAccepted, maxRejected, expectNoExceptions.
Output only valid JSON object.
```

### 3) SQL/H2

```text
Generate one challenge JSON object for a Java interview platform.
Mode: sql.
Challenge should execute user SQL against H2.
Include sandboxProfile { mode: "sql", timeoutMs, setup: [DDL/DML statements] }.
testCases should validate row-level expected table contents.
Output only valid JSON object.
```

### 4) Custom Test + Raw Runner

```text
Generate one challenge JSON object for a Java interview platform.
Mode: custom_test, runner: raw.
Include sandboxProfile with harnessClassName and harnessCode.
harnessCode must define a Java class with main(String[] args) and print exactly one EvaluationResult JSON line.
Output only valid JSON object.
```

### 5) Custom Test + JUnit/Mockito

```text
Generate one challenge JSON object for a Java interview platform.
Mode: custom_test, runner: junit.
Include sandboxProfile with harnessClassName and harnessCode using JUnit 5 + Mockito.
Assume imports are available in sandbox libs.
Keep starterCode minimal and methodContract clear.
Output only valid JSON object.
```

### 6) Batch Prompt (All Types)

```text
Generate 8 challenge JSON objects as an array for a Java interview platform:
- 3 reflective
- 2 concurrent
- 1 sql
- 1 custom_test raw
- 1 custom_test junit
Each object must include full fields:
id, title, level, tags, details, methodContract, explanation, starterCode, testCases, sandboxProfile, hints, rules, resources, examples, notes, score, bestScore, attempts, timeSpentMs, completedAt, status.
Use unique ids and realistic test cases.
Output only valid JSON array.
```
