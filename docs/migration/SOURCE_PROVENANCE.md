# Source Provenance

Status: `ACTIVE_AUTHORITY`

## Source roots and precedence

1. `/Users/cc/Work/neobv/Chess/chess-pgnviewer-vue` — reconciled target authority after this P0 report.
2. `/Users/cc/Work/neobv/Chess/pgnViewer-new` — canonical Vue teaching visual, interaction, active runtime, styles, and direct-asset evidence. Its automated-test infrastructure is evidence only and is not migrated under P0E owner policy.
3. `/Users/cc/Work/neobv/Chess/chess-pgnviewer` — product/UI requirements and confirmed API/auth/persistence evidence; React runtime choices are rejected for this target.
4. `/Users/cc/Work/neobv/Chess/pgnViewer` — secondary evidence only for older capabilities absent or incomplete in the canonical Vue source.

Conflicts resolve in favor of the approved single-Vue architecture, confirmed later-dated owner decisions, and real redacted contract evidence. No source may override security rules or authorize assumptions.

## P0 migration policy

- Product/UI documents were migrated one-to-one and reconciled into Vue authority.
- React governance and stack documents were not copied; their durable invariants were restated in Vue-native authorities.
- Three redacted API artifacts were retained only under `docs/archive/historical-evidence/` and remain non-authoritative.
- No React UI, Zustand store, failed migration, canonical Vue feature runtime, board, PGN, AI, API, auth, persistence, or mock implementation was copied.
- P0E removes target automated-test infrastructure and records that canonical automated tests are not migrated because the owner delivery policy prioritizes visible UI work with typecheck, production build, and narrow real-browser runtime evidence.
- No environment, credential, certificate, key, database, browser state, log, dependency store, build output, cache, generated Serena cache, archive, or unproven screenshot was migrated.

## Asset decision

The canonical runtime directly references a favicon, five product/avatar/icon images, and twelve Merida chess-piece images. Runtime consumers and SHA-256 hashes were verified. Two additional unused candidates were also checked. No local license/attribution record was found; the Merida files have only a provenance comment pointing to the older `pgnViewer`. Under the P0 rights gate, all 20 candidates are inventoried but excluded from active target assets. No product asset was silently discarded or substituted.

## Package-manager decision

The target authority is direct: owner decision superseded the historical npm baseline. `package.json` declares `pnpm@11.11.0`, `.mise.toml` pins pnpm `11.11.0` beside Node `26.5.0`, and `pnpm-lock.yaml` is the authoritative root package-manager lockfile. `package-lock.json` is forbidden, and npm, Yarn, and Bun are forbidden for project dependency management.

The target follows the canonical Vue architecture from `pgnViewer-new` but does not inherit feature-only or blocked dependencies such as `mqtt`, `qrcode`, or `@types/qrcode`. Stable latest versions are preferred, but dependency selection is evaluated as one complete compatible architecture graph, not as unrelated package maxima. The newest stable version that passes the required architecture contract is authoritative. Exceptions require upstream evidence, explicit recording, owner, review trigger, and removal condition. Silent or unexplained downgrades remain forbidden.

The authoritative Vue compiler is the newest stable official TypeScript 6.x package while stable Vue TypeScript 7 integration is unavailable. This follows official TypeScript guidance for Vue and other embedded-language projects. `@typescript/typescript6` is not used because the current stable Volar and `vue-tsc` stack cannot consume its shim. TypeScript 7 is not an active dependency during this compatibility period; adoption is a future gated upgrade only after stable TypeScript programmatic API support, stable Vue Language Tools support, stable `vue-tsc` support, full typecheck/build/browser validation, no automated-test infrastructure, and owner acceptance.

P1 feature migration remains blocked only until P0E acceptance passes. Canonical runtime feature migration must remain mechanical before refactoring, preserving canonical layout, interaction, density, board focus, panel geometry, keyboard behavior, and motion before any refactor.

## Source-integrity evidence and limitation

The original P0 report preserves three historical metadata-digest strings and entry counts, but not the complete serialized manifests or serialization command needed to reproduce those digests independently. They therefore remain historical claims rather than authoritative current whole-tree digests.

This reconciliation deliberately performs no new broad source scan. It verifies only exact source paths referenced by the existing inventories and records source-root metadata before and after the correction. Matching referenced-file hashes, entry counts, or timestamps do not prove byte-for-byte integrity of an entire source tree. The reconciliation report records this evidence as limited and makes no stronger claim.

## Document-count scope

`DOCUMENT_INVENTORY.json` classifies 23 documents: 22 source-derived records plus this target-authored provenance authority. The 23 include `AGENTS.md`, `CLAUDE.md`, and `.ai/skills/project-ui/SKILL.md`. The five generated machine-readable migration JSON files are physical evidence artifacts outside that classified migrated/retained-document count; the document inventory is intentionally self-excluded to avoid recursive self-hashing.

## Inventories

- Documents: `docs/migration/DOCUMENT_INVENTORY.json`
- Assets: `docs/migration/ASSET_INVENTORY.json`
- Canonical runtime closure: `docs/migration/CANONICAL_RUNTIME_CLOSURE.json`
- Capabilities: `docs/migration/CAPABILITY_MATRIX.json`
- API authority: `docs/migration/API_AUTHORITY_MAP.json`
