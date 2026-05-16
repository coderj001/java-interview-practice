## Purpose

TBD

## Requirements

### Requirement: H2 in-memory database setup per evaluation job
For challenges with `sandboxProfile.mode: "sql"`, the system SHALL create a fresh H2 in-memory database for each evaluation run, execute DDL from `sandboxProfile.setup` to establish the schema and seed data, then tear down the database after the job completes.

#### Scenario: Database initialised with setup DDL
- **WHEN** a SQL challenge evaluation begins
- **THEN** `SqlHarness` SHALL execute all SQL statements in `sandboxProfile.setup` against a new `jdbc:h2:mem:<traceId>` database before running any user code

#### Scenario: Database torn down after evaluation
- **WHEN** an evaluation job completes (pass, fail, or exception)
- **THEN** the in-memory database SHALL be closed and all its state discarded

### Requirement: User SQL executed via JDBC statement
The system SHALL execute the user's submitted SQL string against the initialised H2 database using `java.sql.Statement.execute()`. The SQL SHALL be executed within a read-write transaction that is committed before assertions are checked.

#### Scenario: User SQL runs in isolation
- **WHEN** user submits a valid SQL `INSERT` or `CREATE TABLE` statement
- **THEN** `SqlHarness` SHALL execute it in the test database and commit the result without affecting other concurrent evaluation jobs

### Requirement: Row-level assertions from JSON
The system SHALL compare the actual contents of one or more tables against `expected` row objects declared in `testCases[].expected` in `challenges.json`. A test case passes if and only if every row in `expected` exists in the actual table (order-insensitive) and row counts match.

#### Scenario: Correct SQL passes assertion
- **WHEN** user's SQL produces rows matching the `expected` array exactly (same columns, same values, same count)
- **THEN** the test case SHALL be marked `passed: true`

#### Scenario: Wrong row count fails assertion
- **WHEN** user's SQL inserts fewer or more rows than declared in `expected`
- **THEN** the test case SHALL be marked `passed: false` with detail showing actual vs expected row count

#### Scenario: Wrong column value fails assertion
- **WHEN** user's SQL inserts a row with a column value differing from `expected`
- **THEN** the test case SHALL be marked `passed: false` with detail identifying the mismatched column

### Requirement: H2 JAR available in sandbox classpath
The H2 JAR SHALL be bundled in the Docker image at `/app/libs/h2.jar` and included in the `javac` and `java` classpath (`-cp ".:/app/libs/*"`).

#### Scenario: H2 available without network access
- **WHEN** the sandbox container starts with `--network none`
- **THEN** H2 classes SHALL be resolvable from the local filesystem without any network download
