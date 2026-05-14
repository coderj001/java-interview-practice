## Why

The current system executes untrusted Java submissions on the host machine, which weakens isolation and increases security risk. We need a safer, reproducible execution boundary before adding more complex challenge behaviors.

## What Changes

- Add a long-lived containerized Java sandbox runtime for compiling and executing user-submitted solutions.
- Route challenge execution from the Node orchestrator to the sandbox over an internal Docker network.
- Enforce least-privilege runtime defaults: non-root execution, reduced capabilities, bounded CPU/memory/PID resources, and read-only filesystem with required writable temp space.
- Enforce deny-by-default networking for execution jobs, with explicit environment-controlled opt-in overrides for approved challenge scenarios.
- Return structured execution results (compile/runtime/test outcomes) from sandbox to orchestrator without persisting user artifacts.

## Capabilities

### New Capabilities
- `sandboxed-java-execution`: Execute user-submitted Java code inside a hardened long-lived container runtime with policy-based controls and structured results.

### Modified Capabilities
- `node-web-workbench-api`: Challenge run/submit behavior now depends on sandbox-runtime execution outcomes and policy-driven execution limits.

## Impact

- Affected code: `web-ui/src/node/java-runtime.js`, container runtime service code, deployment/runtime configuration, and integration tests.
- Affected systems: local development runtime and challenge evaluation path.
- Dependencies: Docker or Podman availability, sandbox image build pipeline, and environment policy configuration for network override controls.
