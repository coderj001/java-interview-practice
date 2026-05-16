## MODIFIED Requirements

### Requirement: Containerized execution boundary for untrusted Java code
The system MUST compile and execute user-submitted Java solutions inside a hardened long-lived sandbox container runtime instead of directly on the host. The compilation and execution classpath SHALL include all JARs in `/app/libs/` to support challenge-specific libraries (e.g., H2 for SQL challenges, JUnit/Mockito for custom tests). The sandbox runtime MUST dynamically dispatch execution based on the `sandboxProfile.mode` and `runner` properties provided in the job payload.

#### Scenario: Execute submission in sandbox runtime
- **WHEN** the orchestrator receives a challenge run or submit request
- **THEN** it MUST send the execution job to sandbox runtime
- **AND** sandbox runtime MUST compile and run the submitted code within container isolation using `-cp ".:/app/libs/*"`
- **AND** the result MUST be returned as structured JSON including compilation diagnostics and test outcomes

#### Scenario: Execute custom_test with junit runner
- **WHEN** the execution job specifies `mode: custom_test` and `runner: junit`
- **THEN** the sandbox runtime MUST invoke the JUnit Platform Console Launcher
- **AND** parse the resulting test reports to generate the structured JSON outcome

#### Scenario: Execute custom_test with raw runner
- **WHEN** the execution job specifies `mode: custom_test` and `runner: raw`
- **THEN** the sandbox runtime MUST invoke the custom Java class's `main` method directly
- **AND** capture standard output as the structured JSON outcome
