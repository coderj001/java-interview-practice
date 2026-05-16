## Context

The project currently provides a single-user coding workspace and backend APIs for challenge evaluation. A sandbox runtime exists for secure Java execution, but there is no interview session concept with separated interviewer/interviewee responsibilities or centralized time control. The requested model is intentionally minimal: SSE for updates, single interviewer owner, and client-local countdown between authoritative server events.

## Goals / Non-Goals

**Goals:**
- Introduce a two-interface session model with interviewer controls and interviewee read-only timer visibility.
- Make server state authoritative for timer lifecycle while keeping transport simple via SSE.
- Keep timer synchronization lightweight by sending events on state transitions rather than per-second ticks.
- Enforce single-owner authorization for timer mutation endpoints.

**Non-Goals:**
- Multi-interviewer moderation or ownership transfer.
- WebSocket-based bidirectional control channel.
- Persistent session storage across process restarts.
- Recording or replaying full coding activity timelines.

## Decisions

1. Use SSE for state/event distribution.
- Rationale: unidirectional server-to-client updates match the requirement and reduce implementation complexity.
- Alternative considered: WebSocket for richer interactions; rejected for V1 because command channel is already handled via HTTP endpoints.

2. Use server-authoritative timer snapshots with event-based updates only on transitions (`start`, `pause`, `resume`, `adjust`, `end`).
- Rationale: reduces backend push load while preserving consistent timer control.
- Alternative considered: pushing every second; rejected as unnecessary for V1.

3. Keep client ticking local between authoritative events.
- Rationale: smooth UX without high-frequency SSE events.
- Alternative considered: no local ticking and periodic polling; rejected due to poorer UX and redundant requests.

4. Single interviewer owner with strict mutation authorization.
- Rationale: eliminates coordination races and policy ambiguity.
- Alternative considered: multiple controllers; rejected due to role conflict complexity.

5. Include `version` and `serverTime` in every timer event and snapshot.
- Rationale: allows stale-event rejection and drift correction on reconnect/resync.
- Alternative considered: timestamp-only ordering; rejected because optimistic update races are harder to detect.

## Risks / Trade-offs

- [Client clock drift during long uninterrupted runs] -> Mitigation: reset local timer on every authoritative event and force snapshot on reconnect.
- [SSE connection drops cause stale UI state] -> Mitigation: require `GET /sessions/:id/state` bootstrap and re-bootstrap after reconnect.
- [In-memory session state lost on restart] -> Mitigation: document as non-persistent V1 behavior and fail active sessions cleanly.
- [Authorization bypass attempts] -> Mitigation: server-side owner checks on every timer mutation regardless of UI role visibility.

## Migration Plan

- Add session/timer domain module and HTTP endpoints behind existing app server.
- Add SSE stream endpoint and event emission on timer transitions.
- Add interviewer and interviewee views wired to snapshot + SSE flow.
- Add backend tests for authorization, version handling, and event contract.
- Add UI tests for local timer interpolation and authoritative reset behavior.

Rollback:
- Disable new session routes and UI entry points; existing challenge workspace remains operational.

## Open Questions

- Should interviewee `run/submit` be hard-blocked while timer is paused, or allowed with explicit paused-state marking?
- What interviewer identity source is canonical for owner checks in V1 (session token, header, or authenticated user id)?
