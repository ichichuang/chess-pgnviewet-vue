# Claude project context

## Identity

Single-runtime Vue implementation of the 开赛了 chess workspace: teaching, PGN analysis, tournament navigation, replay, read-only live viewing, AI analysis, and big-screen display.

## Canonical surfaces

- `/pgnViewer/` — unified board-centric workspace
- `/competitions` — tournament list
- `/competitions/:hdid` — tournament detail
- `/competitions/:hdid/display` — big-screen display

Compatibility routes resolve a sanitized handoff into the unified workspace; they never render a second board/PGN/AI shell.

## Stack authority

pnpm is the sole package manager. Vue 3, TypeScript strict, Vite, Vue Router, Pinia, project-owned Vue UI adapters, canonical-only Naive UI use, GSAP/Vue transitions, chess.js plus reviewed canonical chess-domain logic, Dexie, Zod, and TanStack Vue Query define the approved target stack. P0E removes automated-test infrastructure from the active target stack so visible, user-facing interface delivery can proceed after governance closure.

Stable latest versions are preferred, but dependency selection is evaluated as one complete compatible architecture graph, not as unrelated package maxima. The newest stable version that passes the required architecture contract is authoritative. Exceptions require upstream evidence, explicit recording, owner, review trigger, and removal condition; silent or unexplained downgrades remain forbidden.

The authoritative Vue compiler is the newest stable official TypeScript 6.x package while stable Vue TypeScript 7 integration is unavailable. This follows official TypeScript guidance for Vue and other embedded-language projects. `@typescript/typescript6` is not used because the current stable Volar and `vue-tsc` stack cannot consume its shim. TypeScript 7 is not an active dependency during this compatibility period; adoption is a future gated upgrade only after stable TypeScript programmatic API support, stable Vue Language Tools support, stable `vue-tsc` support, full typecheck/build/browser validation, and owner acceptance.

React, React Router, TanStack Router, Zustand, XState, React Aria, Radix React, Tailwind token systems, iframe/micro-frontend/Web Component bridges, duplicate stores, duplicate boards, duplicate PGN/AI implementations, and parallel token registries are not part of this architecture.

## Mandatory references

Before UI or feature work, read `AGENTS.md`, `.ai/skills/project-ui/SKILL.md`, relevant `docs/product/**`, `docs/ui/**`, `docs/architecture/**`, and the relevant implementation gate report.

## Hard rules

- Preserve `pgnViewer-new` as the teaching visual/interaction authority without copying its unsafe infrastructure.
- Follow the canonical Vue architecture from `pgnViewer-new`; feature migration must remain mechanical before refactoring.
- Do not migrate the canonical automated-test infrastructure. No automated test files, test runners, fixtures, snapshots, coverage setup, or `test` package scripts may be created or retained.
- Validate with mandatory TypeScript checking, mandatory production build, and one narrow real-browser runtime check for visible UI slices: intended route, nonblank DOM, no Vite error overlay, no console-breaking errors, and real interaction state change when applicable.
- Keep one workspace shell and one global token registry.
- No body scroll; modules declare scroll ownership and preserve geometry.
- No raw visual values in feature files.
- Persist only categorized, non-secret state; logout clears private/auth state while preserving non-sensitive public workspace context.
- Confirmed reads use typed repositories and a same-origin server boundary. Unknown contracts remain blocked, never faked.
- Browser code never owns upstream credentials or signing secrets.
- Do not modify any of the three evidence-source repositories.
- `package-lock.json`, npm dependency management, Yarn, and Bun are forbidden. P1 remains blocked only until P0E acceptance passes.
