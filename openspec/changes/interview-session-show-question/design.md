## Context

The current interview session implementation delivers role-separated timer control and SSE synchronization, but session pages do not show the assigned challenge/question content. Normal mode already reads challenge data from JSON-backed challenge files, so interview mode should reuse this source of truth instead of introducing a separate question store.

## Goals / Non-Goals

**Goals:**
- Bind each interview session to a valid challenge id at creation time.
- Expose challenge details in interview session state payload for both roles.
- Render question content in interviewee page so coding interview can proceed in interview mode.
- Keep implementation minimal by reusing existing challenge loader and existing interview session pages.

**Non-Goals:**
- Multi-question session progression.
- Authoring/editing challenge content from interview pages.
- Persistent session storage across process restarts.

## Decisions

1. Session creation requires `challengeId` and validates it against existing challenge catalog.
- Rationale: prevents empty/invalid interview sessions and ensures deterministic question visibility.
- Alternative: assign challenge later via separate endpoint; rejected to keep V1 flow simple.

2. Session snapshot includes normalized `challenge` object fields needed for rendering.
- Rationale: keeps client bootstrapping single-call before SSE subscription.
- Alternative: separate challenge fetch from client after session state; rejected as unnecessary roundtrip.

3. Interviewee and interviewer pages both render assigned question metadata/details from session state.
- Rationale: interviewer needs quick context and interviewee needs full problem statement.
- Alternative: show question only on interviewee page; rejected due to visibility mismatch during facilitation.

## Risks / Trade-offs

- [Challenge payload size inflates session state response] -> Mitigation: return only necessary fields already used by normal mode views.
- [Session created without challenge due to old clients] -> Mitigation: enforce validation and clear 400 response.
- [Divergence between normal-mode and interview-mode rendering] -> Mitigation: reuse same markdown rendering path and challenge fields.

## Migration Plan

- Extend session store model to include `challengeId` and resolved challenge payload.
- Update session create endpoint to validate and persist challenge assignment.
- Extend interview session snapshot response shape with challenge details.
- Update interview pages script to display challenge title/details.
- Add tests for challenge validation and session state content.

Rollback:
- Remove challenge binding requirement and revert interview pages to timer-only rendering.

## Open Questions

- Should interview mode preload starter code from challenge into a dedicated editor in this flow, or remain question-display only for now?
