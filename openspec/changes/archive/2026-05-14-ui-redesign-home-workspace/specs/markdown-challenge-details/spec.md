## ADDED Requirements

### Requirement: Markdown rendering of challenge details
The challenge workspace SHALL render the challenge `details` field as formatted HTML using the `marked` library.

#### Scenario: Markdown content renders correctly
- **WHEN** a challenge has details containing markdown headings, code blocks, lists, and inline code
- **THEN** the workspace displays them as properly formatted HTML

#### Scenario: Code blocks in details
- **WHEN** challenge details contain fenced code blocks with Java
- **THEN** they render with monospace font (JetBrains Mono) and appropriate styling
