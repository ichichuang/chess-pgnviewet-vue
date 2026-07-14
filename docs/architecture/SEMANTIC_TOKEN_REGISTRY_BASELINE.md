# Semantic Token Registry Baseline

Status: `F3B_GLOBAL_SEMANTIC_TOKEN_REGISTRY_IMPLEMENTED`
Phase: `F3B_GLOBAL_SEMANTIC_TOKEN_REGISTRY_IMPLEMENTATION`
Authority path: `src/styles/tokens.css`
Inventory source: `docs/architecture/CANONICAL_TOKEN_THEME_INVENTORY.json`
Project namespace: project-owned CSS custom properties in `src/styles/tokens.css`

## Scope

F3B implements the evidence-backed semantic token registry only. It does not
implement theme preference, system mode resolution, persistence, no-flash startup,
HTML marker mutation, runtime `color-scheme`, runtime `meta[name="theme-color"]`,
Pinia theme state, Dexie integration, Naive UI providers, Naive UI theme
overrides, reusable UI adapters, product routes, or product UI.

## Inventory Coverage

The accepted inventory contains 86 entries. F3B implements all 86 entries in the
single registry authority.

Domain counts:

- `ui-chrome`: 31
- `radius`: 6
- `spacing`: 8
- `typography`: 8
- `control-geometry`: 4
- `board`: 13
- `annotation`: 6
- `annotation-geometry`: 6
- `evaluation`: 4

Declaration counts:

- Implemented inventory entries: 86
- Deferred inventory entries: 0
- Shared declarations: 55
- Light-scope declarations: 31
- Dark-scope declarations: 31
- Governed compatibility aliases: 3

The light values are declared in `:root, :root[data-theme='light']` so the
current static document remains visually truthful without adding runtime theme
resolution. Dark declarations exist in `:root[data-theme='dark']` for later F3C
runtime ownership.

## Compatibility Aliases

F3B keeps only the compatibility aliases explicitly authorized by F3A and needed
to bridge canonical naming:

| Alias           | Target               | Current consumer | Review trigger                       | Removal condition                                   |
| --------------- | -------------------- | ---------------- | ------------------------------------ | --------------------------------------------------- |
| `--hover`       | `--state-hover-bg`   | none             | Before F3D/F3E consumes legacy names | Remove when no canonical migration code requires it |
| `--active-bg`   | `--state-active-bg`  | none             | Before F3D/F3E consumes legacy names | Remove when no canonical migration code requires it |
| `--ring-accent` | `--state-focus-ring` | none             | Before F3D/F3E consumes legacy names | Remove when no canonical migration code requires it |

No alias chain exceeds one level. No alias contains a raw visual value.

## Consumer Migration

The F3B validation consumer set was limited to the neutral bootstrap:

- `src/styles/index.css` imports `src/styles/tokens.css` exactly once.
- `src/styles/base.css` consumes `--font-sans`, `--fs-base`, `--text`, `--bg`,
  and `--state-focus-ring`.
- `src/App.vue` consumes `--bg` and `--text`.
- `src/main.ts` imports `src/styles/index.css`.

The only mechanical consumer migration in F3B is replacing the old
`--focus-ring` reference with `--state-focus-ring`.

## Governance Rules

Subsequent token additions require canonical source evidence, an approved inventory
entry, a project-owned semantic name, owner review, and validation through the
raw visual-value scanner. Raw feature values, parallel namespaces, feature-local
palettes, and Naive UI literal theme overrides are prohibited.

The raw visual-value scanner permits raw visual values only in the token
authority and approved evidence documents. Current Naive UI mappings derive
from project tokens through the project-owned F3D provider. The F3C theme engine
owns preference resolution, startup markers, persistence boundaries, system
listeners, cross-tab behavior, and runtime document color metadata.

Missing domains remain unimplemented unless a later approved inventory adds
evidence-backed entries: player and connection states, z-index, motion and
easing, reduced motion, safe-area geometry, panel and splitter geometry,
responsive breakpoints, scroll surfaces, meta theme-color values, complete icon
roles, disabled roles, link roles, overlay/dialog/menu/tooltip roles, and
line-height/font-weight scales.

## Validation Contract

F3B completion requires:

- Inventory-to-CSS parity for all 86 entries.
- Correct shared, light, and dark scopes.
- No duplicate same-scope declarations.
- No alias cycle.
- No alias reference to an undefined variable.
- No consumer reference to an undefined project token.
- No parallel token namespace.
- Raw visual governance passing.
- `pnpm` static validation, typecheck, production build, production and full
  audits, and real-browser token-loading validation.

Current development gate: `PRODUCT_UI_DEVELOPMENT_BASELINE_PASS`.
