# Product Definition

| Field   | Value                                                       |
| ------- | ----------------------------------------------------------- |
| Version | 1.2.0                                                       |
| Status  | `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`       |
| Gate    | `PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS` |
| Product | 开赛了                                                      |

## Authority and scope

This document owns only the concise product identity, top-level boundaries, primary audiences, canonical surfaces, and references to the detailed product authority.

[《开赛了融合产品全量需求与中文设计蓝图》](./PRODUCT_DESIGN_BLUEPRINT.zh-CN.md) is the sole authority for product positioning, product modes, journeys, information architecture, priorities, page responsibilities, product requirements, and acceptance concepts. [Workspace Modes](./WORKSPACE_MODES.md) owns only the technical mode/source model, transitions, adapter selection, and persistence behavior.

## Product identity

开赛了 is a single-runtime, board-centric chess teaching and tournament commentary product. It combines local PGN teaching, tournament navigation and commentary, replay/import, read-only live viewing, explicit local AI analysis, and a readability-first venue display without duplicating the chessboard, PGN, annotation, or AI runtime.

It is not an administration console, organization or user management product, generic cloud drive, online-game lobby, write-capable tournament tool, technical diagnostics product, or 3D-first experience.

## Primary audiences

- Primary: chess teachers and coaches preparing and delivering lessons.
- Secondary: tournament operators, parents, other coaches, students, and spectators.
- Internal support receives no implicit product mode, user-facing diagnostics surface, write permission, or administration capability.

## Canonical surfaces

The router is base-aware through `import.meta.env.BASE_URL`. The table separates router paths from deployed browser URLs.

| Surface            | Router path                   | Deployed URL                            | Responsibility                                                                                     |
| ------------------ | ----------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Unified workspace  | `/`                           | `/pgnViewer/`                           | Local teaching, manual position, tournament commentary handoff, replay, and read-only live handoff |
| Tournament list    | `/competitions`               | `/pgnViewer/competitions`               | Anonymous public tournament discovery                                                              |
| Tournament detail  | `/competitions/:hdid`         | `/pgnViewer/competitions/:hdid`         | Anonymous public detail, groups, rounds, pairings, and handoff actions                             |
| Big-screen display | `/competitions/:hdid/display` | `/pgnViewer/competitions/:hdid/display` | Anonymous public pairing display and contract-gated multi-board live display                       |
| Login              | `/login`                      | `/pgnViewer/login`                      | Approved account session and safe return                                                           |

Compatibility router paths `/competitions/:hdid/live`, `/match/:key`, `/share/:uuid`, and `/cloud/:fileid` may produce a sanitized typed handoff into the unified workspace. They never render a second board workspace or imply that a blocked contract is available.

## Product boundaries

- One unified outer workspace geometry: contextual source navigation on the left, one dominant chessboard in the center, and notation/comments/teaching notes/annotations/analysis/information/live status on the right.
- The three primary product modes are local PGN teaching, tournament commentary, and offline electronic-board big-screen display.
- Manual position, explicit AI analysis, replay, live spectator, cloud PGN, and shared content are supporting states or sources. Cloud/share remain contract-blocked.
- AI is disabled by default. Ongoing live games are read-only and expose no AI, engine evaluation, editable PGN, editable variations, or source write-back.
- Tournament list, detail, groups, rounds, pairings, and current public pairing-display composition are anonymous public reads.
- Finished-game replay, protected cloud/share content, hardware history/latest snapshots, live credentials/subscriptions, and authoritative clocks remain protected or contract-dependent.
- Cloud content is read-only import until a separately confirmed write contract exists. No cloud save or cloud write is currently approved.
- Product settings may own theme, board appearance, layout, accessibility, sound, locale, and AI defaults. They exclude user administration, internal diagnostics, API settings, credentials, and protocol configuration.
- A future mode requires an explicit product-authority update. It is not a current `WorkspaceMode`, route, or UI surface.

## Authentication boundary

Exactly one browser account-session record is approved: `kaisaile.auth.v1`, owned by `src/persistence/auth/authPersistence.ts`, stored in `localStorage`, strict Zod version 1, maximum lifetime 43,200 seconds, with only `token`, `uid`, `accountLabel`, and `expiresAt` data fields. This product definition does not require a BFF, cookie session, HttpOnly session, or server-only gateway.

Passwords, password digests, duplicated or arbitrary authentication records, auth values in URLs/router state/Dexie/persisted Query/workspace handoffs/PGN/annotations/AI state, signing secrets, shared upstream credentials, MQTT credentials, secret-bearing URLs, and complete sensitive responses remain forbidden.

## Source and data policy

Only real confirmed production contracts may feed product surfaces. Mock, fixture, fake, sample, synthesized, and fallback success data are forbidden. Protected source content remains read-only; explicit import creates a local copy and never writes notes or annotations back without a separately confirmed write contract.

## Page-design readiness and open decisions

The complete product model is ready for page-by-page design. This readiness does not close product-owner decisions: `OD-01` through `OD-11` all remain open and must stay mapped in page designs, acceptance criteria, and the requirement traceability matrix. Recommended values are provisional and are not current runtime contracts.

## References

- Product authority: [PRODUCT_DESIGN_BLUEPRINT.zh-CN.md](./PRODUCT_DESIGN_BLUEPRINT.zh-CN.md)
- Stable owner origin: [OWNER_PRODUCT_REQUIREMENT_BASELINE.zh-CN.md](./OWNER_PRODUCT_REQUIREMENT_BASELINE.zh-CN.md)
- Technical modes: [WORKSPACE_MODES.md](./WORKSPACE_MODES.md)
- Requirement traceability: [PRODUCT_REQUIREMENT_TRACEABILITY.json](./PRODUCT_REQUIREMENT_TRACEABILITY.json)
- Mode/capability matrix: [PRODUCT_MODE_AND_CAPABILITY_MATRIX.json](./PRODUCT_MODE_AND_CAPABILITY_MATRIX.json)
- Information architecture: [PRODUCT_INFORMATION_ARCHITECTURE.json](./PRODUCT_INFORMATION_ARCHITECTURE.json)
- API authority: `docs/architecture/WEB_API_SOURCE_AUTHORITY.md`
- Persistence authority: `docs/architecture/PERSISTENCE_ADR.md`
