## 1. Session Model and API

- [x] 1.1 Extend interview session store schema to keep ordered `assignedChallengeIds` and per-challenge state (`pending|started|completed`)
- [x] 1.2 Add API validation requiring at least one challenge for interviewer-created interview sessions
- [x] 1.3 Add interviewer-only endpoint/action to start a specific assigned challenge
- [x] 1.4 Ensure session snapshot/SSE payload includes challenge list and states for both roles

## 2. Visibility Gating

- [x] 2.1 Enforce server-side gate so non-started assigned challenges do not return question content
- [x] 2.2 Return a clear locked/waiting response payload for pending challenges
- [x] 2.3 Add tests for unauthorized start attempts and pending challenge access

## 3. Interviewer and Interviewee UI

- [x] 3.1 Update interviewer console UI to select multiple challenges and show their states
- [x] 3.2 Add start control per assigned challenge in interviewer console
- [x] 3.3 Add dedicated interviewee home page listing assigned challenges and statuses
- [x] 3.4 Allow interviewee to open started challenges and show locked state for pending ones

## 4. Verification and Docs

- [x] 4.1 Add/update integration tests for multi-challenge flow across both roles
- [x] 4.2 Update README/API docs with new session payload and challenge start workflow
- [x] 4.3 Run project tests for session store, API, and interview UI flows
