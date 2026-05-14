## Context

This change introduces a full-stack Java interview preparation platform that combines coding challenges, automated evaluation, scoring, learning resources, and AI interview simulation. The current repository does not yet define platform-level behavior, so this design establishes modular boundaries for challenge authoring, evaluation lifecycle, analytics, leaderboard ranking, and AI coaching integrations.

## Goals / Non-Goals

**Goals:**
- Provide browser-based challenge solving with compile/test/submit flow.
- Produce deterministic scoring and rankings from submission outcomes.
- Provide learning progression metadata and challenge explanations.
- Provide profile badges reflecting challenge completion and level progress.
- Provide provider-agnostic AI interview simulation with hints and review.

**Non-Goals:**
- Building a production billing/subscription system.
- Defining final visual branding, full copywriting, or marketing pages.
- Implementing a vendor-specific lock-in for a single LLM provider.

## Decisions

- **Modular service boundaries**: Separate challenge catalog, submission evaluation, analytics, leaderboard, and AI coaching modules to keep concerns isolated and testable.
  - Alternative considered: Monolith with shared state tables only. Rejected because feature growth (AI + ranking + analytics) increases coupling.
- **Event-backed submission lifecycle**: Submissions transition through queued/running/completed states and publish evaluation events consumed by analytics and ranking services.
  - Alternative considered: Synchronous end-to-end request handling. Rejected due to latency and unreliable user experience for heavier workloads.
- **Provider interface for AI simulation**: Use a normalized adapter (`review`, `followUp`, `hint`) so Gemini/OpenAI/Claude can be swapped without changing challenge workflows.
  - Alternative considered: Separate UI/backend logic per provider. Rejected due to duplicated logic and inconsistent interview behavior.
- **Spec-first challenge metadata**: Persist challenge statements, tests, resources, and difficulty tags as structured metadata so catalog and progression are queryable.
  - Alternative considered: Markdown-only challenge storage. Rejected because ranking/progression queries become harder to enforce.

## Risks / Trade-offs

- **[Risk] Sandbox security for user code execution** -> Mitigation: enforce isolated runtime, resource limits, and strict outbound network controls.
- **[Risk] Ranking instability due to flaky tests or timing variance** -> Mitigation: deterministic tests and normalized scoring rules with tie-break policy.
- **[Risk] AI provider failures/latency** -> Mitigation: retries, timeout budgets, provider fallback strategy, and explicit degraded-mode UX.
- **[Risk] Scope growth from broad challenge catalog** -> Mitigation: phase delivery by challenge tiers and validate each tier with acceptance tests.

## Migration Plan

1. Introduce core domain models (challenge, submission, score, badge, interview-session).
2. Implement challenge workbench and evaluation APIs with baseline tests.
3. Add ranking + analytics processing from evaluation events.
4. Add profile badge generation and public embed endpoints.
5. Add AI interview simulation API adapters and UI flows.
6. Populate challenge catalog by tier and run end-to-end validation.

## Open Questions

- Should execution runtime support multiple JDK versions in v1?
- Which leaderboard scope is authoritative in v1 (global only vs challenge + category + global)?
- Should AI interview transcripts be retained, and for how long?
