## 1. Web UI Workspace Move

- [x] 1.1 Move the active Node server, package metadata, templates, and browser assets into a `web-ui/` workspace
- [x] 1.2 Update start, dev, and test entry points so the browser workbench still runs from the reorganized `web-ui/` location

## 2. Challenge Folder Structure

- [x] 2.1 Create `challenges/challenge-<id>/` folders for the seeded challenge set with metadata, starter code, and challenge-local solutions directories
- [x] 2.2 Add a single challenge path/loading module that resolves challenge assets from the new `challenges/` filesystem layout

## 3. Submission and Git Flow Migration

- [x] 3.1 Change solution persistence to save submissions under `challenges/challenge-<id>/solutions/<user>.java`
- [x] 3.2 Update Git guidance and submission responses to reference the new challenge-local save path while still targeting the root repository

## 4. Runtime, Docs, and Verification

- [x] 4.1 Adapt challenge listing and starter-code loading to use challenge-folder assets without regressing the current evaluation flow
- [x] 4.2 Update documentation and automated verification to cover the `web-ui/` workspace, challenge-folder layout, and root-repo Git workflow
