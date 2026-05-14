## ADDED Requirements

### Requirement: Real-time AI interview feedback
The system MUST provide real-time AI-assisted review feedback on submitted code, including quality and improvement guidance.

#### Scenario: User requests code review
- **WHEN** a user requests interview review for a solution
- **THEN** the system MUST return feedback including at least one quality assessment and one concrete improvement suggestion

### Requirement: Dynamic follow-up questioning
The system MUST generate follow-up interview questions based on the user's submitted solution approach.

#### Scenario: User completes initial solution
- **WHEN** interview simulation is active and a solution is submitted
- **THEN** the system MUST generate at least one follow-up technical question tied to the solution

### Requirement: Progressive hinting and provider choice
The system MUST provide four hint levels and allow configured use of Gemini, OpenAI, or Claude providers.

#### Scenario: User requests stronger hint
- **WHEN** a user asks for the next hint level
- **THEN** the system MUST return a hint that corresponds to the next configured level of detail

#### Scenario: Provider switch
- **WHEN** a valid provider configuration is changed by the user
- **THEN** the system MUST route subsequent interview-simulation requests to the selected provider adapter
