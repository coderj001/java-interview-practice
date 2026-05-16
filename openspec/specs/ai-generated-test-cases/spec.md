## Purpose

TBD

## Requirements

### Requirement: AI test case generation endpoint
The Orchestrator SHALL expose `GET /api/challenges/:id/ai-tests?provider=<name>&count=<n>` that uses the AI provider to generate `count` additional test cases for the challenge, based on the challenge's `aiTestConfig.promptTemplate`.

#### Scenario: AI generates valid test cases
- **WHEN** the endpoint is called with a valid challenge ID and provider
- **THEN** the response SHALL be a JSON array of test case objects, each with `name` (string), `input` (array), and `expected` (value) fields

#### Scenario: Default count when not specified
- **WHEN** the `count` query parameter is omitted
- **THEN** the Orchestrator SHALL request `aiTestConfig.defaultCount` cases (or 3 if not declared)

### Requirement: AI output validated before use
The Orchestrator SHALL validate each AI-generated test case against the challenge's `methodContract` type signature before returning or injecting it into an evaluation run. Invalid cases SHALL be silently dropped with a warning logged, not cause a 500 error.

#### Scenario: AI returns wrong type for input
- **WHEN** the AI generates a test case with a string where an int is expected per `methodContract`
- **THEN** that test case SHALL be excluded from the response with a server-side warning log; remaining valid cases SHALL still be returned

#### Scenario: AI returns malformed JSON
- **WHEN** the AI response cannot be parsed as a valid test case array
- **THEN** the endpoint SHALL return `{ "aiTests": [], "warning": "AI returned malformed test data" }` with status 200 (not 500)

### Requirement: AI test cases injected into evaluation run
A submission request MAY include an `includeAiTests: true` flag. When set, the Orchestrator SHALL fetch AI-generated test cases for the challenge and append them to the evaluation payload sent to the sandbox. AI test case results SHALL be returned in the `aiTests[]` field of the evaluation response, separate from the baseline `tests[]`.

#### Scenario: AI tests scored as advisory only
- **WHEN** a submission includes `includeAiTests: true`
- **THEN** the `correctnessPoints` score SHALL be calculated from baseline `tests[]` only; `aiTests[]` results SHALL be informational and SHALL NOT affect the score

#### Scenario: AI test injection disabled by default
- **WHEN** a submission does not include `includeAiTests: true`
- **THEN** no AI tests SHALL be generated or appended, preserving existing evaluation latency

### Requirement: Per-challenge AI prompt template
Each challenge in `challenges.json` MAY declare `aiTestConfig.promptTemplate` - a string with `{methodContract}`, `{examples}`, and `{count}` placeholders. The Orchestrator SHALL interpolate these values before calling the AI provider.

#### Scenario: Prompt template interpolated correctly
- **WHEN** a challenge has `promptTemplate: "Generate {count} test cases for {methodContract} given examples: {examples}"`
- **THEN** the Orchestrator SHALL substitute `{count}`, `{methodContract}`, and `{examples}` with the actual values before sending to the AI provider
