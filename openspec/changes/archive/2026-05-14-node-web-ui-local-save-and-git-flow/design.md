## Context

The platform needs a practical web interface with backend orchestration for submission, evaluation, and local repository persistence. The current Java core models exist, but there is no web API or local Git-flow guidance layer.

## Goals / Non-Goals

**Goals:**
- Use Node.js + Express as the fastest web/API layer.
- Save submitted code to deterministic local repository paths.
- Return Git workflow commands in submit responses.
- Preserve Java compile/test evaluation flow.

**Non-Goals:**
- Full production auth/billing/multi-tenant design.
- Remote cloud repository writes.

## Decisions

- **Node.js/Express backend** for API orchestration and filesystem/Git integration speed.
- **File-based persistence** under `solutions/<challengeId>/<user>.java`.
- **Submission contract** returns save location, evaluation result, and Git commands.
- **Runtime split** keeps Java for code execution/testing while Node handles HTTP/API.

## Risks / Trade-offs

- **[Risk] Git commands may fail in non-git directories** -> Mitigation: pre-check repository status and return actionable error.
- **[Risk] Unsafe path input** -> Mitigation: strict challenge/user ID sanitization and path normalization.
- **[Risk] Local-only persistence limits portability** -> Mitigation: add pluggable storage adapter later.

## GitHub Codespaces Benefits

- No local setup required.
- Pre-configured Java development environment.
- Full VS Code experience in the browser.
- Automatic port forwarding for the web UI.
- Dependencies pre-installed.
- Works on any device with a modern browser.
