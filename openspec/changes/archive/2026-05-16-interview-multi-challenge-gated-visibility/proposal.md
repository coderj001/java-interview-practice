## Why

Interview sessions currently assume a single challenge and immediate question visibility, which makes interviewer-led sequencing hard to control. We need interviewer-controlled multi-challenge flow so candidates only see a challenge when it is explicitly started.

## What Changes

- Add interviewer console behavior to select multiple challenges for a single interview session.
- Add interviewee home view that shows assigned challenge list and per-challenge state.
- Gate question visibility so interviewee sees challenge details only after interviewer starts that challenge.
- Keep timer/session ownership with interviewer while challenge activation controls visibility.

## Capabilities

### New Capabilities
- `interviewer-multi-challenge-console`: Interviewer can configure and start challenges one-by-one within a session.
- `interviewee-session-home`: Interviewee can view assigned challenges, but challenge content is hidden until started.

### Modified Capabilities
- None.

## Impact

- Affected specs: new capability specs for interviewer console and interviewee session home.
- Affected backend: interview session APIs/store must support multiple assigned challenge IDs and per-challenge start state.
- Affected frontend: interviewer console selection/start controls and interviewee home/list/detail gating behavior.
