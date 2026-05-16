# Context: Java Interview Practice Sandbox

## Glossary

### Sandbox Runtime
A long-lived containerized Java execution service used to compile and run user-submitted Java solutions.

### Orchestrator
The host Node.js web server that validates requests, sends execution jobs to Sandbox Runtime, and returns results.

### Network Mode
Policy that controls egress/ingress for Sandbox Runtime.
Default is `none` (no network).
Optional override is enabled explicitly by environment configuration for network-required challenge types.

### Sandbox Mode
The execution strategy used by the Sandbox Runtime to evaluate a candidate's solution. Represents whether the sandbox uses a generic built-in strategy (like `reflective`, `jdbc`, `concurrent`) or a `custom_test` approach.

### Custom Test Harness
A complete, author-provided Java test class embedded directly within a challenge definition (e.g. in `challenges.json`). Used exclusively when the Sandbox Mode is `custom_test` to evaluate complex solutions. The harness can use different `runner` strategies:
- `junit`: A standard JUnit/Mockito test class executed via the Console Launcher, where the sandbox automatically translates test results into the standard JSON score.
- `raw`: A raw Java class with a `main` method that takes full responsibility for calculating scores and printing the final JSON output to standard out.

## Domain Rules

1. Untrusted user Java code executes only inside Sandbox Runtime.
2. Sandbox Runtime is long-lived and hardened with least-privilege controls.
3. Network access is deny-by-default and opt-in via explicit environment configuration.
