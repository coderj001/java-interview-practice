## Why

The current app has a single workspace experience and no interviewer-controlled session model, which makes timed interviews inconsistent and hard to audit. We need role-specific interfaces with a centralized authoritative timer so interviewer intent is enforced consistently.

## What Changes

- Add a session model with two roles: interviewer (owner/controller) and interviewee (participant).
- Add centralized server-side timer state per session, with interviewer-only control actions.
- Add SSE stream for session and timer events; clients render local ticking between server events.
- Add interviewer console UI for start/pause/resume/adjust/end timer actions.
- Add interviewee workspace UI with read-only timer state.
- Enforce single-owner authorization for all timer mutation endpoints.
- Add snapshot endpoint for reconnect/resume bootstrap before subscribing to SSE.

## Capabilities

### New Capabilities
- `interview-session-control`: Role-based interview session management with interviewer-owned timer controls.
- `session-timer-sse-sync`: Server-authoritative timer snapshots and SSE event delivery for client-side synchronized countdown rendering.

### Modified Capabilities
- `node-web-workbench-api`: Add session/timer endpoints and owner authorization semantics for timer mutations.

## Impact

- Affected backend APIs in `web-ui/server.js` and related Node modules.
- New frontend surfaces for interviewer and interviewee workflows in `web-ui/` views/scripts.
- New in-memory session/timer state management and SSE connection handling.
- New tests for authorization, event ordering/versioning, and reconnect snapshot behavior.
