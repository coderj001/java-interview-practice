## 1. Local Workspace Cleanup

- [x] 1.1 Execute `git rm -r --cached target/ out/ .java-runtime/classes/` to stop tracking the build directories in Git.
- [x] 1.2 Delete the physical directories `target/`, `out/`, and `.java-runtime/classes/` from the local workspace.

## 2. Ignore Configuration

- [x] 2.1 Add `target/` to `.gitignore`.
- [x] 2.2 Add `out/` to `.gitignore`.
- [x] 2.3 Add `.java-runtime/classes/` to `.gitignore`.
