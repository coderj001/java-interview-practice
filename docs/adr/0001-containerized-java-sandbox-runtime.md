# ADR 0001: Containerized Java Sandbox Runtime

## Status
Accepted

## Date
2026-05-15

## Context
This system executes untrusted user-submitted Java code for challenge evaluation.
Current host-based execution increases risk and weakens isolation.

We need stronger safety while preserving the existing Node web orchestrator flow.

## Decision
Adopt a long-lived containerized Sandbox Runtime for Java execution, with the following rules:

1. Untrusted user Java code executes only inside Sandbox Runtime.
2. Node server acts as Orchestrator and communicates with Sandbox Runtime over Docker internal network.
3. Sandbox Runtime exposes an internal HTTP API (`POST /execute`).
4. Payload is rich and validated:
   - `challengeId`
   - `sourceCode`
   - `timeoutMs` (capped)
   - `memoryMb` (capped)
   - `networkModeRequested`
   - `traceId`
5. Policy enforcement authority is in Sandbox Runtime:
   - default network mode deny (`none`)
   - optional network mode override only when explicitly enabled by environment policy
6. Sandbox image bakes Java runtime and challenge test harness.
7. No user artifact persistence between requests.

## Security Baseline
Sandbox Runtime must run with least privilege defaults:

- non-root user
- dropped Linux capabilities
- read-only root filesystem (with required writable tmpfs)
- PID, memory, and CPU limits
- default `--network none`

## Consequences
### Positive
- Clear trust boundary between host orchestrator and untrusted execution.
- Stronger containment for malicious or buggy submissions.
- Reproducible runtime independent of host JDK drift.
- Better policy auditability via explicit payload + enforced sandbox policy.

### Negative
- Higher operational complexity versus direct host `java` execution.
- Long-lived sandbox service needs health management and observability.
- Network-enabled challenge scenarios require explicit policy and careful review.

## Alternatives Considered
1. Host Java execution with limited process controls
- Rejected: weaker isolation and host coupling remain.

2. Ephemeral container per request
- Rejected for now: safer by default but higher startup overhead; team selected long-lived service first.

3. Orchestrator-only policy enforcement
- Rejected: policy bypass risk if host logic regresses; sandbox must be final authority.
