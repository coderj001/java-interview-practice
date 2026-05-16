## Why

Interviewer/interviewee pages currently show timer-only state, which breaks the interview flow because candidates cannot see the assigned question. We need interview mode to surface challenge content from the same JSON-backed source as normal mode.

## What Changes

- Add challenge binding to interview session creation so each session references a specific question.
- Extend interview session state payload to include challenge metadata/details needed for rendering.
- Render question content in interviewee page when session loads, matching normal-mode challenge visibility.
- Show challenge context in interviewer page so both roles share the same question reference.
- Validate challenge existence during session creation and return clear errors for invalid challenge ids.

## Capabilities

### New Capabilities
- `interview-session-challenge-visibility`: Interview sessions expose assigned challenge content from JSON and render it in role-specific pages.

### Modified Capabilities
- `interview-session-control`: Session creation and state retrieval requirements include challenge assignment and visibility.

## Impact

- Backend session model and routes in `web-ui/server.js` and `web-ui/src/node/interview-session-store.js`.
- Interview role pages/scripts in `web-ui/views/` and `web-ui/public/interview-session.js`.
- Tests for session creation validation and state payload challenge fields.
