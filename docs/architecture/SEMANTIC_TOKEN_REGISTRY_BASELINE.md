# Semantic Token Registry Baseline

Status: `ACTIVE_RUNTIME_AUTHORITY`

Authority path: `src/styles/tokens.css`

## Decision

`src/styles/tokens.css` is the only global visual token registry. Project-owned feature and UI code consumes semantic custom properties from that file and does not create parallel palettes, raw governed values, or Naive UI literal theme authority.

## Current ownership

- Shared, light, and dark declarations are owned by the registry.
- `src/styles/index.css` imports the registry through the single global style entry.
- The current theme engine resolves and applies the light/dark scope.
- Project-owned Naive UI adapters derive their theme overrides from project tokens.
- Board, annotation, evaluation, layout, typography, spacing, radius, state, focus, and motion roles use existing registry families.

Inventory documents are evidence for established values; they do not authorize a second registry or imply that an undeclared target preference is implemented.

## Governance

New token values require a demonstrated product/runtime need, a project-owned semantic name, owner review, and raw-value scanner validation. Raw feature values, feature-local palettes, duplicate namespaces, alias cycles, undefined token references, and literal theme-provider values are prohibited.

Compatibility aliases remain acceptable only while a tracked consumer or canonical compatibility need exists. Their removal condition is zero active consumers and no accepted source-compatibility requirement.

## Validation contract

Changes require registry/consumer integrity checks, raw-value governance, style lint, typecheck, production build, audits, and narrow real-browser validation for visible behavior. Target setting roles such as accent or board appearance do not become current until they have an approved UI and persistence owner.
