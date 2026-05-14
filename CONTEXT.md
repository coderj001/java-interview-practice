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

## Domain Rules

1. Untrusted user Java code executes only inside Sandbox Runtime.
2. Sandbox Runtime is long-lived and hardened with least-privilege controls.
3. Network access is deny-by-default and opt-in via explicit environment configuration.
