## ADDED Requirements

### Requirement: Ignore build artifacts
The repository MUST ignore all standard Java and application build artifacts to keep the commit history clean.

#### Scenario: Generating artifacts
- **WHEN** build artifacts are generated in `target/`, `out/`, or `.java-runtime/classes/`
- **THEN** Git does not track them and they do not appear as untracked files in `git status`
