## Context

The current implementation works, but its filesystem layout does not match the intended product model. Challenge metadata is defined in Java, saved user solutions are written into a shared `solutions/` tree, and the Node host lives at the repository root. This makes the runtime harder to reason about because challenge content, runtime code, and UI code do not have clear ownership boundaries.

This change introduces those boundaries without changing the high-level architecture: Node remains the web host, Java remains the evaluation runtime, and Git remains configured once for the whole repository.

## Goals / Non-Goals

**Goals:**
- Establish `challenges/` as the source-of-truth location for challenge content and per-challenge saved solutions.
- Establish `web-ui/` as the source-of-truth location for the Node server, templates, and browser assets.
- Preserve a single root Git workflow for submissions.
- Migrate challenge loading and save paths with minimal behavior regression in the browser workflow.

**Non-Goals:**
- Introduce per-challenge nested Git repositories.
- Replace the Java evaluator with a different runtime.
- Add cloud persistence, auth, or multi-user collaboration.
- Fully redesign challenge semantics beyond what is needed to support the new directory structure.

## Decisions

- **Single root repository remains the Git boundary.**
  Rationale: Git guidance and developer workflow stay simple when all challenge content and UI code are tracked in one repository.
  Alternative considered: one Git repo per challenge. Rejected because it complicates submit guidance, tooling, and review without solving a current problem.

- **Each challenge gets a dedicated folder under `challenges/`.**
  Rationale: grouping metadata, prompt content, starter code, visible tests, and saved solutions makes challenge ownership explicit and prepares the system for file-backed challenge loading.
  Alternative considered: keep a shared `solutions/` tree while only moving metadata. Rejected because it preserves split ownership for the same challenge.

- **`web-ui/` becomes the Node application boundary.**
  Rationale: separating the browser host from runtime code makes the repo easier to navigate and reduces future coupling between web concerns and Java concerns.
  Alternative considered: keep Node files at repo root. Rejected because it leaves the current ambiguity in place.

- **File-backed challenge loading will be introduced at the Node and runtime boundary incrementally.**
  Rationale: the smallest safe migration is to first move layout and save paths, then load challenge metadata and starter assets from files while preserving existing evaluator behavior.
  Alternative considered: rewrite all challenge definitions and evaluator inputs in one step. Rejected because it increases migration risk and makes failures harder to isolate.

## Risks / Trade-offs

- **[Risk] Migration can break challenge discovery if path assumptions remain hardcoded** -> Mitigation: centralize challenge path resolution and update tests around listing, loading, and submission paths.
- **[Risk] Java evaluation may still depend on embedded challenge definitions during the transition** -> Mitigation: stage the migration so file-backed loading is introduced through a defined adapter instead of rewriting all evaluator logic at once.
- **[Risk] Moving the Node host under `web-ui/` can break scripts and docs** -> Mitigation: update package entry points, documentation, and verification commands in the same change.
- **[Risk] Existing saved solution paths become stale** -> Mitigation: define a single new canonical path and migrate or recreate development fixtures during the refactor.

## Migration Plan

1. Create `web-ui/` and move the active Node server, static assets, templates, and package metadata into that workspace.
2. Create `challenges/challenge-<id>/` folders for the current seeded challenge set and place metadata, prompt content, starter code, and visible test assets there.
3. Change submission persistence from `solutions/<challengeId>/<user>.java` to `challenges/challenge-<id>/solutions/<user>.java`.
4. Update challenge listing/loading to read from the new challenge folders through a single loading module or adapter.
5. Update Git guidance so it continues to detect and reference the root repository while returning the new challenge-local save path.
6. Update docs and tests to validate the new layout and entry points.

Rollback strategy: because this is a local development application, rollback is a code revert to the previous layout plus restoration of the previous save path contract.

## Open Questions

- Should challenge metadata be fully consolidated into `challenge.json`, or should some evaluation-specific detail remain Java-owned during the first migration step?
- Should visible tests in each challenge folder be the exact source used by the evaluator, or a UI-facing subset while Java retains hidden deterministic checks?
