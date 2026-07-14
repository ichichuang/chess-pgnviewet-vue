# Product-First Delivery Authority

Status: `PRODUCT_UI_MIGRATION_READY`

## Decision

The product-first gate is satisfied. The repository contains the accepted
single-runtime Vue product workspace and may continue with narrow,
source-confirmed improvements without reopening bootstrap phases.

## Accepted delivery order

1. One Vue/Vite/Router/Pinia/Query/token foundation.
2. Canonical application shell and workspace geometry.
3. Canonical board and reusable chessboard boundary.
4. PGN loading, navigation, editing, and variations.
5. Annotation tools and geometry.
6. Workspace controls, panels, splitter, and persistence.
7. Local AI Worker analysis.
8. Tournament list, detail, display, and sanitized handoff surfaces.
9. Source-confirmed Web API reads behind typed repositories.

## Continuing rules

- Preserve canonical visible behavior before refactoring.
- Keep one board-centric workspace and one product component system.
- Keep framework-free chess domains outside Vue UI ownership.
- Keep server state in TanStack Vue Query and transport DTOs inside
  repositories.
- Keep unsupported remote capabilities truthfully unavailable.
- Do not introduce automated-test infrastructure, mocks, or source-project
  imports.
- Validate visible changes in a real browser after typecheck and production
  build.

## API authority

This document does not own API contracts. The complete active API authority set
is listed in `docs/migration/SOURCE_PROVENANCE.md`.
