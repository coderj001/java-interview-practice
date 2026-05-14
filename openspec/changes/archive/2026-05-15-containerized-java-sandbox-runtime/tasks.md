## 1. Sandbox Runtime Service

- [x] 1.1 Create a sandbox runtime service with internal `POST /execute` endpoint that accepts `challengeId`, `sourceCode`, `timeoutMs`, `memoryMb`, `networkModeRequested`, and `traceId`.
- [x] 1.2 Implement sandbox-side compilation and execution flow using baked-in challenge runtime/test harness and structured JSON result output.
- [x] 1.3 Implement sandbox policy enforcement for execution limits and network modes (default deny, explicit env-controlled override).

## 2. Containerization and Hardening

- [x] 2.1 Add container build artifacts (Dockerfile/Containerfile and runtime startup config) for the sandbox service.
- [x] 2.2 Configure least-privilege runtime defaults: non-root user, dropped capabilities, read-only root filesystem with writable temp space, and bounded CPU/memory/PID limits.
- [x] 2.3 Define environment configuration contract for sandbox policy controls and document default-safe values.

## 3. Node Orchestrator Integration

- [x] 3.1 Refactor `web-ui/src/node/java-runtime.js` to call sandbox runtime over internal Docker network instead of host `javac/java` process execution.
- [x] 3.2 Map sandbox success and error responses to existing API response contracts for run-tests and submit endpoints.
- [x] 3.3 Ensure save/evaluate pipeline behavior remains consistent for challenge status, scoring, and leaderboard updates.

## 4. Verification and Regression Coverage

- [x] 4.1 Add integration tests for default network deny behavior and policy-rejected execution requests.
- [x] 4.2 Add integration tests for approved network override behavior under explicit allow configuration.
- [x] 4.3 Add tests for timeout/memory limit handling and non-persistence of job artifacts between requests.
