# Internationalization Specification

| Field   | Value                                                |
| ------- | ---------------------------------------------------- |
| Version | 1.1.0                                                |
| Status  | `COMPLETE_ACTIVE_PRODUCT_UI_SPEC_RESIDUE_PURGE_PASS` |

## Purpose

Define the target project-owned Vue internationalization boundary and current terminology rules without claiming an implemented locale runtime, translation tree, persistence field, or package.

## Current state

- No project-owned Vue i18n runtime is implemented.
- No locale store, locale persistence adapter, translation-file tree, generated key type, or Naive UI locale synchronization owner is implemented.
- `index.html` does not read a locale before mount.
- The current synchronous bootstrap preference is theme-only.
- Current user-facing Simplified Chinese must use the exact product name “开赛了”; the legacy homophone represented by `U+51EF U+8D5B U+4E50` is forbidden.

## Approved target boundary

When implemented, one project-owned Vue boundary will own:

- typed locale identifiers;
- translation namespaces and keys;
- `html[lang]` synchronization;
- Naive UI locale/date-locale synchronization where Naive UI adapters are present;
- `Intl`-based date, time, number, plural, and relative-time formatting;
- missing-key and fallback behavior;
- a versioned non-sensitive locale preference after mount.

Simplified Chinese is the primary product language. English is the approved fallback target. Additional languages require an explicit product decision and must not change product identity or introduce a second translation runtime.

No exact package, source directory, storage field, or generated-code path is approved by this specification.

## Target key and formatting rules

- Keys are stable, namespaced, and typed once an implementation owner exists.
- Runtime string concatenation is avoided when grammar varies by locale.
- Dates and times use `Intl.DateTimeFormat` through the project boundary.
- Numbers use `Intl.NumberFormat`.
- Plurals use `Intl.PluralRules` or equivalent `Intl` behavior behind the project boundary.
- Relative times use `Intl.RelativeTimeFormat`.
- Markup uses component/slot interpolation owned by the selected Vue boundary.
- CSS favors logical properties so a later right-to-left language is not structurally blocked; right-to-left support is not a current commitment.

## Persistence boundary

Locale is an approved target user preference, not a current field. It must not be read from Dexie or `localStorage` before mount until a project-owned locale runtime and persistence adapter are implemented and documented in `docs/ui/PERSISTENCE_RECOVERY_SPEC.md`.

## Validation

Current validation enforces terminology and the forbidden product-name variant. Future translation-schema, key-parity, unused-key, and locale-synchronization validation becomes applicable only after the runtime and translation assets exist. Such validation must use the repository's accepted static checks, typecheck, build, and narrow real-browser inspection without adding automated-test infrastructure.

## Acceptance criteria

1. Current runtime absence and target i18n responsibilities are clearly separated.
2. No nonexistent locale path, package, composable, store, or persistence field is presented as implemented.
3. “开赛了” remains the sole Simplified Chinese product name.
4. The target boundary uses typed namespaces and `Intl` formatting after implementation.
5. Locale is not claimed as restored before Vue mount.

## Machine-readable summary

```json
{
  "document": "i18n-spec",
  "version": "1.1.0",
  "status": "COMPLETE_ACTIVE_PRODUCT_UI_SPEC_RESIDUE_PURGE_PASS",
  "current_runtime_implemented": false,
  "current_locale_persistence": false,
  "current_locale_prepaint": false,
  "primary_product_language": "zh-CN",
  "approved_fallback_target": "en",
  "runtime_package": "UNSELECTED",
  "exact_implementation_paths_approved": false,
  "forbidden_homophone": "U+51EF U+8D5B U+4E50"
}
```
