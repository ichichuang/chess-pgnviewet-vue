# Product Complete Usable Integration Baseline

Status: `ACCEPTED_PRODUCT_EVIDENCE`

## Scope

This document retains the accepted product and UI evidence only. Web API
authority is owned exclusively by the files listed in
`docs/migration/SOURCE_PROVENANCE.md`.

## Accepted runtime

- One Vue bootstrap, Router, Pinia, QueryClient, token registry, and application
  shell.
- One board-centric workspace for analysis, teaching, replay, commentary, and
  live-unavailable states.
- Canonical board, PGN, annotation, local AI Worker, workspace toolbar, panels,
  splitter, theme, and motion behavior.
- Tournament list, detail, and big-screen routes consume typed domain
  repositories.
- Compatibility routes create sanitized handoffs into the one workspace.
- Unsupported remote capabilities render truthful unavailable states.

## Accepted journeys

1. Open `/pgnViewer/`, load or create PGN content, navigate moves, annotate,
   and inspect local analysis.
2. Open `/competitions`, apply filters, and render either confirmed tournament
   data or the deployment-unavailable state.
3. Open `/competitions/:hdid`, choose group and round, and enter the replay
   handoff without claiming protected replay availability.
4. Open `/competitions/:hdid/display` and render the same confirmed read
   models in the big-screen profile.
5. Follow compatibility routes into the canonical workspace without duplicate
   board, PGN, or analysis shells.

## Validation contract

Product changes require formatting, lint, Stylelint, governance, Knip,
typecheck, production build, dependency audit, and one narrow real-browser
validation of the intended route, nonblank DOM, error-overlay absence,
console-breaking-error absence, and an interaction state change when
applicable. Automated test infrastructure remains prohibited.
