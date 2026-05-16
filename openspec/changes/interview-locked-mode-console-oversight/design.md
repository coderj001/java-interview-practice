## Context

Interview sessions currently provide synchronized timer control and challenge visibility, but the interview flow still mixes candidate workspace concerns with interviewer governance concerns. The requested direction is a locked mode where interviewer owns challenge assignment and timer policy, while interviewee works only on the assigned challenge. Interviewer also needs post-submit oversight (status, code, output) without observing live typing.

The runtime remains in-memory and non-persistent by design, so session state, timer adjustments, and submission logs must remain process-local.

## Goals / Non-Goals

**Goals:**
- Enforce role-scoped UI and API behavior in interview sessions.
- Let interviewer select challenge from JSON catalog before session run.
- Provide timer controls for `+1`, `+5`, `+10` minutes and expose progress bar-ready state.
- Record submit-time snapshots so interviewer can inspect candidate code/output only after submit.
- Keep implementation minimal by extending existing session store and SSE session state flow.

**Non-Goals:**
- Real-time interviewer view of draft candidate code.
- Persistent storage across process restarts.
- Multi-owner interviewer sessions.
- Multi-challenge progression inside one running session.

## Decisions

1. Introduce explicit session phase guardrails (`draft|ready|running|paused|ended`) with challenge assignment locked after first start.
- Rationale: keeps policy predictable and prevents mid-interview problem switching.
- Alternative: allow challenge change while paused; rejected to avoid ambiguity and fairness concerns.

2. Extend session state payload with progress bar primitives instead of client-derived guesses.
- Rationale: server already owns authoritative timer/version; returning `totalBudgetMs` and `elapsedMs` avoids drift.
- Alternative: clients compute based on initial duration and local adjustments; rejected due to reconnect/version complexity.

3. Persist submission snapshots in memory and expose them via interviewer-only APIs.
- Rationale: interviewer needs audit trail only after explicit candidate submit action.
- Alternative: stream every run-test/edit event; rejected to preserve candidate privacy and reduce noisy telemetry.

4. Keep interviewee in locked session view (assigned challenge only), without challenge catalog browsing.
- Rationale: aligns with controlled interview workflow.
- Alternative: allow challenge list navigation; rejected because it conflicts with locked interview requirement.

## Risks / Trade-offs

- [In-memory submission logs can grow during long sessions] -> Mitigation: store bounded fields and optionally cap entries per session.
- [Legacy clients that assume single `+1` adjust button] -> Mitigation: maintain existing endpoint contract and add new button deltas client-side.
- [Role checks may be bypassed if headers are inconsistent] -> Mitigation: centralize actor ownership checks in session mutation/submit handlers.
- [Challenge required semantics changed recently] -> Mitigation: document fallback/default assignment and interviewer pre-start override flow in README.

## Migration Plan

1. Extend interview session store model with phase, timer budget fields, selected challenge metadata, and submission log array.
2. Add challenge assignment endpoint and enforce pre-run mutability rules.
3. Add submission endpoint and interviewer-only submission log endpoint.
4. Update interview session UI for locked interviewee view, interviewer challenge picker, timer increment set, and progress bar.
5. Add tests for role permissions, challenge assignment lock, timer progress values, and post-submit visibility.
6. Update docs for new flow and sample requests.

Rollback:
- Revert to current session store snapshot model and disable new endpoints/buttons.

## Open Questions

- Should `Run Tests` attempts be included in interviewer-visible logs, or only `Submit` snapshots?
- Should late submits after timer end be blocked or accepted with `late=true` metadata?
