## Why

The current project layout mixes challenge content, saved user solutions, the Node host, and the Java runtime across root-level folders and hardcoded Java classes. That makes the challenge model harder to evolve and makes the intended product boundaries less clear.

## What Changes

- Reorganize challenge assets under a top-level `challenges/` directory with one folder per challenge.
- Move saved user solutions from the shared `solutions/` tree into each challenge folder.
- Move the Node.js host and browser assets under a dedicated `web-ui/` workspace.
- Keep Git configured once at the project root and ensure submission guidance continues to target the root repository.
- Update runtime loading so challenge metadata and starter assets can be sourced from the new challenge folder structure instead of only from embedded Java definitions.

## Capabilities

### New Capabilities
- `challenge-folder-layout`: Define the required per-challenge directory structure for metadata, prompts, starter code, tests, and saved solutions.
- `web-ui-workspace-layout`: Define the required `web-ui/` application boundary for the Node server, templates, and browser assets.
- `root-repo-solution-git-flow`: Define how saved solutions and Git guidance work when the entire project remains a single root Git repository.

### Modified Capabilities

None.

## Impact

- Affected code: Node server entry point, solution persistence, Git guidance, challenge loading, Java runtime integration, documentation, and tests.
- Affected filesystem layout: challenge assets move under `challenges/`; Node host files move under `web-ui/`.
- Affected APIs: submission responses will return challenge-local save paths in the new structure.
- Dependencies: no new runtime dependency is required by default; the change should preserve the current Node + JDK toolchain.
