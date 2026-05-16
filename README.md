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
