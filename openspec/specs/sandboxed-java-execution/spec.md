## Purpose

TBD

## Requirements

### Requirement: Containerized execution boundary for untrusted Java code
The system MUST compile and execute user-submitted Java solutions inside a hardened long-lived sandbox container runtime instead of directly on the host. The compilation and execution classpath SHALL include all JARs in `/app/libs/` to support challenge-specific libraries (e.g., H2 for SQL challenges).

#### Scenario: Execute submission in sandbox runtime
- **WHEN** the orchestrator receives a challenge run or submit request
- **THEN** it MUST send the execution job to sandbox runtime
- **AND** sandbox runtime MUST compile and run the submitted code within container isolation using `-cp ".:/app/libs/*"`
- **AND** the result MUST be returned as structured JSON including compilation diagnostics and test outcomes

### Requirement: Deny-by-default networking with explicit opt-in
The sandbox runtime MUST deny network access for execution jobs by default and only allow broader network modes when explicitly enabled by runtime policy.

#### Scenario: Default network deny
- **WHEN** an execution job is processed without approved network override
- **THEN** sandbox runtime MUST execute with network mode set to none

#### Scenario: Policy-validated network override
- **WHEN** an execution job requests network access
- **THEN** sandbox runtime MUST validate the request against configured allow policy
- **AND** sandbox runtime MUST reject the request when policy does not permit the requested mode

### Requirement: Per-job isolation and cleanup
The sandbox runtime MUST avoid persisting user-submitted artifacts across jobs.

#### Scenario: Cleanup after execution
- **WHEN** a job finishes (success or failure)
- **THEN** sandbox runtime MUST remove job-local temporary files
- **AND** no user source or compiled classes MUST remain available to subsequent jobs
