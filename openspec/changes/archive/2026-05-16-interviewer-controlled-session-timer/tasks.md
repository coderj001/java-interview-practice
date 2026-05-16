## 1. Session and Timer Domain

- [x] 1.1 Add in-memory interview session model with interviewer owner, interviewee participant, and timer state (`state`, `remainingMs`, `version`, `serverTime`)
- [x] 1.2 Implement timer transition handlers (`start`, `pause`, `resume`, `adjust`, `end`) with authoritative version increments and stale-version conflict checks
- [x] 1.3 Add server-side authorization checks so only interviewer owner can execute timer mutations

## 2. API and SSE Endpoints

- [x] 2.1 Add session snapshot endpoint returning authoritative timer fields for reconnect/bootstrap
- [x] 2.2 Add timer mutation endpoints for interviewer controls with expected-version input validation
- [x] 2.3 Add SSE endpoint that streams ordered timer lifecycle events with required payload fields

## 3. Interviewer and Interviewee Interfaces

- [x] 3.1 Add interviewer UI surface exposing timer controls and handling command responses/conflicts
- [x] 3.2 Add interviewee UI surface showing read-only timer state and synchronized countdown display
- [x] 3.3 Implement shared client timer logic: bootstrap from snapshot, subscribe to SSE, local interpolation, authoritative reset on new events

## 4. Verification and Documentation

- [x] 4.1 Add backend tests for owner authorization, stale-version rejection, and event payload contract
- [x] 4.2 Add frontend tests for local timer countdown behavior and reset on authoritative events
- [x] 4.3 Update README with session startup/usage notes for interviewer/interviewee modes and SSE timer synchronization behavior
