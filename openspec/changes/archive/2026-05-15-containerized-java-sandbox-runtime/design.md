## Context

The current evaluation path executes Java compilation and runtime directly from the host via Node child processes. This mixes trusted application concerns with untrusted code execution and makes safety guarantees dependent on host configuration. The change introduces a dedicated sandbox runtime boundary while preserving the current web API contract.

## Goals / Non-Goals

**Goals:**
- Isolate untrusted Java compilation and execution in a long-lived containerized runtime.
- Keep Node as orchestrator and route execution over an internal Docker network.
- Enforce least-privilege defaults with deny-by-default networking.
- Keep response shape compatible with existing run/submit workflows.

**Non-Goals:**
- Replacing challenge definitions or test semantics.
- Multi-tenant distributed execution scheduling.
- Persisting user code or execution artifacts inside sandbox.

## Decisions

- Long-lived sandbox runtime service with internal HTTP API (`POST /execute`).
  Rationale: lower per-request startup overhead than ephemeral containers while keeping a strict isolation boundary.
  Alternative considered: per-request `docker run --rm`; rejected for now due to latency/cold-start overhead.

- Policy authority resides in sandbox runtime.
  Rationale: orchestrator may request limits/network mode, but sandbox must enforce final policy to prevent host-side regression from weakening controls.
  Alternative considered: orchestrator-only enforcement; rejected due to bypass risk.

- Default network mode is `none`, with explicit environment-controlled opt-in.
  Rationale: secure-by-default execution; only approved challenge types can request broader access.
  Alternative considered: always-on bridge networking; rejected due to expanded attack surface.

- Runtime and test harness are baked into sandbox image.
  Rationale: reproducible execution and minimized host filesystem exposure.
  Alternative considered: bind-mounting runtime files; rejected due to coupling and accidental host leakage risk.

- No persistence of user artifacts between requests.
  Rationale: reduces cross-request contamination and data retention risk.

## Risks / Trade-offs

- [Long-lived process state drift] -> Add health checks and periodic restart strategy.
- [Policy misconfiguration can block valid networked challenges] -> Add explicit env contract and integration tests for deny/allow paths.
- [Operational complexity compared to host execution] -> Keep API surface minimal and reuse existing evaluation response schema.
- [Resource caps may cause false negatives for heavier solutions] -> Enforce conservative defaults with configurable upper bounds.
