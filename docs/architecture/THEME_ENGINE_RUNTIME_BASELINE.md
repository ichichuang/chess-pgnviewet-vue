# Theme Engine Runtime Baseline

Status: `ACTIVE_RUNTIME_AUTHORITY`

## Scope

The current theme engine owns light, dark, and system preference resolution, synchronous pre-Vue restoration, document synchronization, Pinia state, failure-safe non-sensitive persistence, system preference response, cross-tab synchronization, listener cleanup, and no-flash startup behavior.

It does not own accent selection, board appearance selection, locale, sound, AI defaults, or structured Dexie preferences.

## Ownership

- `index.html` owns the synchronous pre-Vue bootstrap boundary.
- `src/theme/constants.ts` owns preference and marker identifiers.
- `src/theme/types.ts` owns typed preference, resolved-theme, and bootstrap snapshot contracts.
- `src/theme/runtime.ts` owns validation, resolution, document markers, `color-scheme`, and token-backed theme-color synchronization.
- `src/bootstrap/preferences/themePreference.ts` is the typed runtime owner for the `themeMode` `localStorage` record.
- `src/stores/theme.ts` owns Pinia preference state, startup adoption, set/reset behavior, media and storage listeners, idempotent initialization, and cleanup.
- `src/main.ts` initializes the existing theme store before Router installation and Vue mount.

## Contract

Preference identifiers are `light`, `dark`, and `system`; resolved identifiers are `light` and `dark`. The storage key is `themeMode` and contains only the preference identifier. The startup default is `system`.

The bootstrap applies `html[data-theme-mode]`, `html[data-theme]`, `color-scheme`, and `meta[name="theme-color"]`, then publishes the typed bootstrap snapshot. Invalid or inaccessible storage, unavailable `matchMedia`, and recoverable DOM limitations do not prevent application mount.

No password, token, auth record, signing material, MQTT credential, cookie, private response, URL, locale, or unrelated preference is stored by this owner.

## Runtime behavior

- Preference changes write only `themeMode` and update the resolved markers.
- System changes affect the applied theme only while preference is `system`.
- Storage events reconcile valid external `themeMode` changes without feedback writes.
- Initialization is idempotent and cleanup removes its listeners.
- Persistence failure leaves the selected theme active in memory.
- No theme-transition animation is required; reduced-motion behavior remains governed by the project motion authority.

## Current boundaries

The token registry, Naive UI provider composition, QueryClient, repositories, product routes, and product UI already have separate current owners. This theme engine neither duplicates nor delays them. Accent, board appearance, locale, sound, AI defaults, and structured application preferences remain target responsibilities until their own contracts are approved.

## Validation contract

Changes require the relevant governance checks, formatting, lint, typecheck, temporary-output production build, audits, and narrow real-browser verification of startup markers, preference changes, system response, storage failure, cross-tab behavior, and absence of a theme flash.
