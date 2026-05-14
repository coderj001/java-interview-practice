## Context

The repository currently contains tracked compiled build output (`target/`, `out/`, `.java-runtime/classes/`). This leads to git repository bloat, meaningless diffs, and potential merge conflicts on binary files.

## Goals / Non-Goals

**Goals:**
- Remove built `.class` files and directories from version control tracking.
- Update `.gitignore` to prevent future commits of these directories.

**Non-Goals:**
- Altering the Maven `pom.xml` configuration.
- Modifying any application logic or source code.

## Decisions

- Add the directories to `.gitignore` first.
- Execute `git rm -r --cached` to stop tracking the directories.
- Delete the directories locally so the workspace is clean.

## Risks / Trade-offs

- **Risk**: Deleting `.java-runtime/classes/` locally means the application will need to recompile them on the next run.
- **Mitigation**: The `java-runtime.js` automatically recompiles the classes if they are missing. This is a non-issue.
