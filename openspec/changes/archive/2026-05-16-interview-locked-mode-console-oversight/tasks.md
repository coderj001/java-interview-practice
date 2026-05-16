## 1. Session Model and API Controls

- [x] 1.1 Extend interview session store with phase state, selected challenge metadata, progress budget fields, and in-memory submission log
- [x] 1.2 Add interviewer-only challenge assignment endpoint with validation against challenge catalog
- [x] 1.3 Enforce challenge reassignment lock once session transitions to `running`
- [x] 1.4 Add interviewer-only submission log read endpoint and role checks

## 2. Timer and Progress Enhancements

- [x] 2.1 Add timer adjust controls for `+1`, `+5`, and `+10` minutes in interviewer UI
- [x] 2.2 Extend timer mutation/state payloads with progress bar fields (elapsed, total budget, remaining)
- [x] 2.3 Ensure SSE snapshot/update events include the same progress fields for both roles

## 3. Locked Interview UI and Submission Oversight

- [x] 3.1 Restrict interviewee session UI to assigned challenge context + coding workspace actions only (no challenge list navigation)
- [x] 3.2 Add interviewer challenge picker from JSON-backed challenge catalog in pre-run session phase
- [x] 3.3 Add interviewee submit flow that stores immutable submit snapshot records
- [x] 3.4 Add interviewer submission log panel showing status and post-submit code/output details

## 4. Verification and Documentation

- [x] 4.1 Add backend tests for role authorization, challenge assignment lock, submission snapshot persistence, and visibility rules
- [x] 4.2 Add UI/script tests for progress bar rendering and timer increment controls across both roles
- [x] 4.3 Update README with locked interview mode flow, challenge selection, timer increments, and submission oversight behavior
