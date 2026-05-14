# ai-system-prompt Specification

## Purpose
TBD - created by archiving change ui-redesign-home-workspace. Update Purpose after archive.
## Requirements
### Requirement: Global system prompt file
The server SHALL load a `system-prompt.md` file from the project root at startup and use its content as the system message in all AI hint and review API calls.

#### Scenario: System prompt loaded on startup
- **WHEN** the server starts and `system-prompt.md` exists
- **THEN** its content is loaded into memory and available for AI calls

#### Scenario: System prompt missing
- **WHEN** the server starts and `system-prompt.md` does not exist
- **THEN** the server uses a sensible default system prompt and logs a warning

### Requirement: Per-challenge AI context
AI hint and review calls SHALL include the challenge's `hints` array and `rules` object as additional context alongside the global system prompt.

#### Scenario: Hint call with challenge context
- **WHEN** user requests a hint for a challenge with hints ["Think about recursion", "Consider base cases"] and rules { "maxHintLevel": 3, "guidanceStyle": "socratic" }
- **THEN** the AI call includes the system prompt, the challenge hints, the guidance style, and the user's current code

#### Scenario: Rules limit hint depth
- **WHEN** a challenge has rules.maxHintLevel set to 2
- **THEN** the hint endpoint SHALL not progress beyond level 2 for that challenge

### Requirement: System prompt reference in challenges.json
The `challenges.json` file SHALL have a top-level `systemPrompt` field containing the file path to the system prompt markdown file.

#### Scenario: Custom system prompt path
- **WHEN** challenges.json has `"systemPrompt": "system-prompt.md"`
- **THEN** the server reads `system-prompt.md` relative to the project root

