## MODIFIED Requirements

### Requirement: Containerized execution boundary for untrusted Java code
The system MUST compile and execute user-submitted Java solutions inside a hardened long-lived sandbox container runtime instead of directly on the host. The compilation and execution classpath SHALL include all JARs in `/app/libs/` to support challenge-specific libraries (e.g., H2 for SQL challenges).

#### Scenario: Execute submission in sandbox runtime
- **WHEN** the orchestrator receives a challenge run or submit request
- **THEN** it MUST send the execution job to sandbox runtime
- **AND** sandbox runtime MUST compile and run the submitted code within container isolation using `-cp ".:/app/libs/*"`
- **AND** the result MUST be returned as structured JSON including compilation diagnostics and test outcomes
