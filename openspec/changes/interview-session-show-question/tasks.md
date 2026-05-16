## 1. Session Challenge Binding

- [x] 1.1 Extend interview session model to persist `challengeId` and resolved challenge content fields needed by interview pages
- [x] 1.2 Update `POST /api/interview-sessions` to require `challengeId` and validate it against existing challenge catalog
- [x] 1.3 Return clear 400 validation errors for missing or unknown challenge ids

## 2. Session State and API Response

- [x] 2.1 Extend `/api/interview-sessions/:sessionId/state` payload to include assigned challenge `id`, `title`, and `details`
- [x] 2.2 Ensure SSE bootstrap/snapshot event includes the same assigned challenge context used by clients

## 3. Interview Pages Question Rendering

- [x] 3.1 Update interviewee page script to render assigned challenge title/details when session loads
- [x] 3.2 Update interviewer page script to show assigned challenge identifier/title alongside timer controls
- [x] 3.3 Reuse existing markdown rendering path for challenge details to match normal mode visibility

## 4. Verification and Docs

- [x] 4.1 Add backend tests for session creation challenge validation and state payload challenge fields
- [x] 4.2 Add UI/script tests for question rendering from session state in both roles
- [x] 4.3 Update README session creation example to include `challengeId` and mention question visibility behavior
