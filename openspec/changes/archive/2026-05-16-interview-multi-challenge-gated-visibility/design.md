## Context

The current interview flow supports timed sessions, but challenge handling is effectively single-item and exposes question content immediately. The requested behavior adds interviewer-led sequencing across multiple challenges with strict visibility gating for interviewees.

## Goals / Non-Goals

**Goals:**
- Support assigning multiple challenges in one interview session.
- Allow interviewer to start a specific challenge explicitly.
- Show interviewee a dedicated home/list view of assigned challenges.
- Hide challenge question details until the selected challenge is started.

**Non-Goals:**
- No new real-time protocol beyond existing session update channel.
- No change to challenge evaluation semantics.
- No persistence model redesign beyond current session storage constraints.

## Decisions

1. Session model stores ordered `assignedChallengeIds` plus per-challenge state (`pending|started|completed`).
- Rationale: minimal extension to existing interview session payload while preserving deterministic sequencing.
- Alternative considered: separate challenge-session entity per challenge. Rejected as too heavy for current scope.

2. Interviewer console controls activation via explicit `start challenge` action.
- Rationale: single owner model already exists for timer control and aligns with interview moderation.
- Alternative considered: auto-start first pending challenge on timer start. Rejected because user asked for explicit control.

3. Interviewee challenge detail route enforces visibility gate server-side.
- Rationale: client-only hiding is insufficient; APIs must reject unopened challenge detail requests.
- Alternative considered: hide only in UI. Rejected for policy integrity.

4. Interviewee home page becomes default entry for interview sessions.
- Rationale: provides list context and state without leaking problem details.
- Alternative considered: direct open challenge page. Rejected because it conflicts with gated visibility requirement.

## Risks / Trade-offs

- [Risk] Interviewer starts challenges out of intended order -> Mitigation: keep ordered list and surface status clearly in console.
- [Risk] Visibility regressions leak question text through legacy endpoints -> Mitigation: enforce start-state validation at API layer for session-scoped challenge fetch.
- [Risk] Added state transitions increase UI edge cases -> Mitigation: cover pending/started/completed transitions in store and UI tests.

## Migration Plan

- Extend session payload and APIs to carry multi-challenge state.
- Update interviewer console and interviewee session home UI.
- Add tests for gating and state transitions.
- Deploy without data migration for existing ephemeral sessions.
- Rollback by disabling multi-challenge fields and reverting to single challenge flow.

## Open Questions

- Should interviewer be allowed to start multiple challenges concurrently, or exactly one active at a time?
- Should completed challenges remain re-openable for review by interviewee during same session?
