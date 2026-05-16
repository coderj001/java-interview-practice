## Why

Interview sessions need tighter control boundaries so interviewers can run a structured evaluation without leaking challenge navigation or live in-progress code visibility. The current flow lacks interviewer challenge assignment controls, richer time controls, and submission-centric oversight.

## What Changes

- Add a locked interview mode where interviewee sees only assigned challenge context and basic session information.
- Add interviewer challenge selection from existing JSON challenge catalog.
- Add interviewer timer adjustment controls for `+1`, `+5`, and `+10` minutes.
- Add time progress bar for both interviewer and interviewee session views.
- Add submission logging so interviewer can see candidate code/output and status only after submit.
- Restrict interviewer challenge reassignment after session transitions to running state.

## Capabilities

### New Capabilities
- `interview-locked-session-mode`: Defines role-scoped visibility and challenge assignment workflow in interview sessions.
- `interview-submission-oversight`: Defines post-submit visibility of candidate code/output/status and submission log behavior for interviewer.
- `interview-session-timer-controls`: Defines progress bar behavior and multi-increment timer adjustments.

### Modified Capabilities
- None.

## Impact

- Backend session APIs and in-memory store in `web-ui/server.js` and `web-ui/src/node/interview-session-store.js`.
- Interview session client rendering and controls in `web-ui/public/interview-session.js` and role-specific views.
- Additional test coverage for role permissions, state transitions, submission visibility, and progress rendering.
- Documentation updates in `README.md` for interview flow and APIs.
