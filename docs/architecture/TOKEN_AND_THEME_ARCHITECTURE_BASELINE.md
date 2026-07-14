# Token and Theme Architecture Baseline

Status: `ACTIVE_RUNTIME_AUTHORITY`

## Decision

`src/styles/tokens.css` is the only global visual-value registry. `src/styles/index.css` is the single global style entry. Product features, board consumers, and project-owned UI/provider adapters consume semantic tokens and do not define parallel palettes or raw governed values.

The current UI theme preference is `light`, `dark`, or `system`. The current runtime applies the resolved `light` or `dark` mode through the project theme engine. No global board-theme setting, accent setting, locale setting, sound setting, or AI-default setting is currently implemented.

## Current token ownership

The registry owns the current semantic surface, text, border, accent, feedback, focus, elevation, typography, spacing, radius, control geometry, workspace geometry, board, move-state, annotation, evaluation, z-index, and motion roles. New values require a real product/runtime need, a semantic name, owner review, and raw-value scanner validation.

Compatibility aliases may remain only while an active consumer or reviewed compatibility need exists. They are not a second namespace. Feature code should use current semantic/component/board roles.

Low-level board appearance strings are validated and scoped to one component root, but this validation is not an exception for product feature code: product-facing values still use `var(--...)` references. Low-level overrides do not create a board-theme selector or persistence contract.

## Theme engine ownership

- `index.html` owns synchronous pre-Vue restoration of the narrow non-secret `themeMode` preference and initial document markers.
- `src/theme/constants.ts` and `src/theme/types.ts` own identifiers and types.
- `src/theme/runtime.ts` owns validation, resolution, document synchronization, `color-scheme`, and token-derived theme-color behavior.
- `src/bootstrap/preferences/themePreference.ts` owns raw storage access for `themeMode`.
- `src/stores/theme.ts` owns Pinia preference state, system response, cross-tab reconciliation, idempotent initialization, and cleanup.
- `src/app/providers/` owns the singular Naive UI provider and token-derived overrides.

Invalid or inaccessible storage, unavailable media queries, and recoverable document limitations must not prevent application mount. Explicit light/dark preferences ignore system changes; system mode follows them. Storage-event handling does not create feedback writes.

## Target setting boundary

The product blueprint permits later page designs for board appearance, accent, accessibility, sound, locale, layout, and AI default policy. These are target responsibilities, not current fields. They require a page design, token mapping, persistence owner, validation schema, reset/recovery behavior, accessibility review, and relevant OD resolution before implementation.

Open decisions remain `OD-03`, `OD-04`, and `OD-11`; display sizing and spacing remain `OD-05` and `OD-06`. No recommended value is a current runtime contract.

## Rules

1. Raw colors, shadows, radii, spacing scales, z-indexes, and motion values live only in the token authority or an explicit scanner allowlist.
2. Feature-local token registries, literal Naive UI themes, and unvalidated custom theme manifests are forbidden.
3. Board and venue-display composition share the same token authority.
4. Theme state, provider state, and document markers each retain one owner.
5. Current and target settings remain explicitly separated.

## Validation contract

Token or theme changes require registry/consumer integrity checks, raw-value governance, formatting, lint, Stylelint, Knip, static aggregate, TypeScript checking, temporary-output production build, audits, and narrow real-browser validation of affected startup, mode, provider, board, responsive, focus, contrast, and reduced-motion behavior.
