# UI Acceptance Checklist

| Field   | Value                                                       |
| ------- | ----------------------------------------------------------- |
| Version | 1.2.1                                                       |
| Status  | `COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN`       |
| Gate    | `PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS` |

## Purpose

Consolidate current and target UI acceptance checks without treating unimplemented settings, persistence, locale, adapters, or display capabilities as already active.

Approved verification methods are `static`, `lint`, `stylelint`, `typecheck`, `build`, `audit`, `manual-browser`, `manual-review`, and `contract-evidence`. The project does not add automated-test infrastructure.

## Current runtime checks

### Theme and tokens

| ID  | Check                                                                                                                                                                  | Method                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| T1  | Feature visual values resolve through `src/styles/tokens.css`; no parallel token registry or unapproved raw values exist.                                              | static, stylelint     |
| T2  | Current light, dark, and system modes initialize without a theme flash and remain synchronized.                                                                        | manual-browser        |
| T3  | Current theme persistence contains only the narrow `themeMode` preference; accent, board appearance, locale, sound, and AI defaults are not claimed as current fields. | static, manual-review |

### Layout and responsive behavior

| ID  | Check                                                                                                                   | Method                        |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| L1  | The body is not the main scroll owner; each visible module has one explicit scroll owner.                               | static, manual-browser        |
| L2  | The board remains square, visible, and stable when current persisted layout controls change.                            | manual-browser                |
| L3  | Current layout recovery is limited to fields implemented by `workspaceLayoutPersistence.ts`.                            | static, manual-review         |
| R1  | Desktop, tablet, and narrow compositions preserve board priority, keyboard access, focus return, and reachable context. | manual-browser, manual-review |
| R2  | Big-screen is an independent read-only route composition and does not import the complete teaching workspace.           | static, manual-browser        |

### Components and sources

| ID  | Check                                                                                                     | Method                            |
| --- | --------------------------------------------------------------------------------------------------------- | --------------------------------- |
| C1  | Every component described as implemented resolves to a tracked target path and verified symbol/export.    | static                            |
| C2  | Presentational project UI components remain store-free and repository-free.                               | static, typecheck                 |
| C3  | External data is mapped and validated before UI consumption; blocked contracts expose unavailable states. | static, contract-evidence         |
| C4  | Ongoing live sources are read-only and expose no AI, evaluation, source editing, or write-back.           | static, manual-browser            |
| C5  | Completed replay/source content requires explicit import before editing or analysis.                      | manual-browser, contract-evidence |

### Persistence and recovery

| ID  | Check                                                                                                                                                          | Method                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| PR1 | Current theme, workspace-layout, handoff, auth, Query, analysis, and live ownership matches tracked runtime code.                                              | static, manual-review         |
| PR2 | Current refresh restores only theme mode, implemented workspace layout, sanitized handoff context, and valid auth; Query refetches into an empty memory cache. | static, manual-browser        |
| PR3 | Only the strict 43,200-second `kaisaile.auth.v1` account record is approved; all other auth and protected raw persistence remains forbidden.                   | static, audit, manual-browser |
| PR4 | General preferences, drafts, locale, teaching collection, and persisted Query-cache models are forbidden as current claims until their owners exist.           | static, manual-review         |
| PR5 | Invalid or missing sources resolve to a picker, validated local game, or truthful recovery/unavailable state, never fabricated success data.                   | manual-browser                |

### Accessibility and copy

| ID  | Check                                                                                       | Method                        |
| --- | ------------------------------------------------------------------------------------------- | ----------------------------- |
| A1  | Interactive controls are keyboard reachable, labelled, and show visible focus.              | static, manual-browser        |
| A2  | Reduced motion, contrast, touch targets, and status semantics meet their UI specifications. | manual-review, manual-browser |
| A3  | User-facing Simplified Chinese uses “开赛了” and not the forbidden homophone.               | lint                          |

## Target checks activated by implementation

These checks are not claims that the capability currently exists:

| ID  | Target check                                                                                                             | Activation gate                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| TT1 | Accent and board appearance controls map only to approved token-backed roles.                                            | Setting design and persistence owner approved.               |
| TT2 | Locale keys, fallback, formatting, `html[lang]`, and UI-provider synchronization use one project-owned Vue boundary.     | Locale runtime implemented.                                  |
| TP1 | Teaching collection, game/node recovery, node comments/annotations, and game note use versioned validated local records. | Target persistence adapters implemented.                     |
| TD1 | Multi-board display protects confirmed readable sizes, pages when required, and preserves focus/fault states.            | Display source contracts plus `OD-05` and `OD-06` decisions. |
| TA1 | AI defaults respect accepted scope and resource settings.                                                                | `OD-03` and `OD-04` resolved.                                |
| TS1 | Sound default and persistence match owner intent.                                                                        | `OD-11` resolved.                                            |
| TN1 | Lesson/session notes recover with an explicit owner.                                                                     | `OD-02` resolved.                                            |

## Cross-cutting gates

1. No unconfirmed endpoint, payload, provider, live transport, cloud provider, or share-response shape is treated as a current contract.
2. No mock, fixture, sample, synthesized, or fallback product success data is introduced.
3. No current UI specification requires automated tests or a test package command.
4. Browser validation for visible changes checks the intended route, nonblank DOM, absence of an error overlay, absence of console-breaking errors, and a real interaction state change when applicable.
5. Static, typecheck, build, audit, and contract-evidence gates remain mandatory where applicable.

## Machine-readable summary

```json
{
  "document": "ui-acceptance-checklist",
  "version": "1.2.1",
  "status": "COMPLETE_PRODUCT_DESIGN_FINAL_READY_FOR_PAGE_DESIGN",
  "page_design_gate": "PAGE_BY_PAGE_UI_DESIGN_READY_WITH_TRACKED_OWNER_DECISIONS",
  "current_and_target_checks_separated": true,
  "automated_test_infrastructure_required": false,
  "current_locale_runtime": false,
  "current_query_cache_persisted": false,
  "big_screen_independent_route_composition": true,
  "open_owner_decisions": ["OD-02", "OD-03", "OD-04", "OD-05", "OD-06", "OD-09", "OD-11"]
}
```
