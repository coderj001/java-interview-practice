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
