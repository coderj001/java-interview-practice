## ADDED Requirements

### Requirement: Server-authoritative session timer snapshot
The system SHALL maintain authoritative timer state per session and expose it via a snapshot endpoint.

#### Scenario: Client bootstraps timer state
- **WHEN** a client requests the session state snapshot
- **THEN** the response SHALL include `timerState`, `remainingMs`, `serverTime`, and `version`

### Requirement: Event-based timer synchronization over SSE
The system SHALL emit SSE timer events only for state transitions and adjustments.

#### Scenario: Timer transition emits SSE event
- **WHEN** the timer changes through `start`, `pause`, `resume`, `adjust`, or `end`
- **THEN** the system SHALL emit an SSE event containing `sessionId`, `timerState`, `remainingMs`, `serverTime`, and `version`

### Requirement: Client-local interpolation between authoritative events
Clients SHALL render a local countdown between authoritative server events.

#### Scenario: Countdown rendering between events
- **WHEN** no new authoritative timer event has arrived
- **THEN** the client SHALL decrement the displayed remaining time locally until the next authoritative event or zero

#### Scenario: Authoritative correction
- **WHEN** a new authoritative timer event arrives
- **THEN** the client SHALL reset local timer state to event values and ignore stale versions
