# Internationalization Specification

## Purpose

Define the project-owned Vue i18n boundary for languages, key naming, namespaces, formatting, locale synchronization, and the guard around the product name "开赛了". This specification does not select or claim an implemented runtime package.

## Scope

This document governs:

- Supported languages and fallback rules.
- Project-owned Vue i18n namespace layout.
- Key naming conventions.
- Date, time, number, and plural formatting.
- Typed locale identifiers, HTML `lang`, and Naive UI locale/date-locale synchronization.
- Right-to-left future considerations.
- Code patterns and validation.

## Non-goals

- UI component APIs are defined in `docs/ui/COMPONENT_SYSTEM_SPEC.md`.
- Accessibility rules are defined in `docs/ui/ACCESSIBILITY_SPEC.md`.

## Supported languages

| Language           | Code    | Status            |
| ------------------ | ------- | ----------------- |
| Simplified Chinese | `zh-CN` | Primary           |
| English            | `en`    | Required fallback |

Additional languages may be added without changing the key structure.

## Fallback rules

1. The default locale is `zh-CN`.
2. `en` is the required fallback locale when the selected locale cannot resolve a key.
3. If neither the selected locale nor the English fallback resolves a key, use the key name as a last resort and report a missing-translation warning in development.

## Namespace layout

```
public/locales/
  zh-CN/
    common.json       # Shared chrome, buttons, errors
    workspace.json    # Workspace modes, toolbar, panels
    board.json        # Board labels, coordinates, piece names
    pgn.json          # Move list, annotations, headers
    analysis.json     # Engine, evaluation, classification
    competition.json  # Tournament, group, round, pairing
    display.json      # Big-screen display strings
  en/
    ...
```

## Key naming conventions

- Use camelCase.
- Prefix with feature namespace conceptually: `workspace.toolbar.openFile`, `board.coordinate.e4`, `pgn.annotation.brilliant`.
- Avoid concatenating keys at runtime; prefer full keys or small, enumerated maps.
- Product name must use the exact string "开赛了" in `zh-CN` translations.

## Product name guard

- User-facing Chinese text must use "开赛了".
- Do not use the legacy homophone variant represented by `U+51EF U+8D5B U+4E50`.
- A lint rule rejects that variant in `public/locales/**/*.json` and in source strings.

## Formatting

- Dates and times: `Intl.DateTimeFormat` through the project-owned Vue i18n boundary or a project formatter.
- Numbers: `Intl.NumberFormat`.
- Plurals: the project-owned Vue i18n boundary maps typed plural keys through `Intl.PluralRules` or an equivalent `Intl`-based formatter.
- Relative time: `Intl.RelativeTimeFormat` for "5 minutes ago".

## Locale synchronization

- Locale identifiers are the typed union `zh-CN | en` until an approved phase extends it.
- The project-owned Vue i18n boundary synchronizes the active locale to `html[lang]`.
- The same active locale synchronizes Naive UI locale and date-locale providers.
- The package implementing this boundary remains unselected until a dedicated implementation phase records it.

## Code patterns

```vue
<script setup lang="ts">
import { useProjectI18n } from '@/i18n'

const { t } = useProjectI18n('workspace')
</script>

<template>
  <button>{{ t('toolbar.openFile') }}</button>
</template>
```

- Use the project-owned Vue i18n adapter's component/slot interpolation for strings containing markup.
- Avoid hard-coded user-facing strings in feature components.
- Keys must be typed via a generated TypeScript interface from the source JSON files.

## Right-to-left future support

- CSS uses logical properties (`inline-start`, `block-start`) where possible.
- `dir="rtl"` handling is not required for phase one but must not be blocked by absolute left/right positioning in new components.

## Validation

- Translation files are validated with a Zod schema.
- Missing keys across languages are reported in CI.
- Unused-key detection runs in development.

## Rules

### R1. All user-facing strings are keyed

No hard-coded user-facing text in feature components except unavoidable constants (e.g., PGN headers).

### R2. Chinese product name is exact

"开赛了" is the only allowed user-facing Chinese product name.

### R3. Keys are namespaced and typed

Each translation key belongs to a namespace and has a TypeScript type derived from the JSON files.

### R4. Formatting uses Intl APIs

Dates, numbers, and plurals use `Intl` formatters, not manual string construction.

### R5. Fallback chain is predictable

Selected language → English fallback → key name, with `zh-CN` as the default locale and warnings logged.

## Acceptance criteria

1. Supported languages and fallback chain are documented.
2. Namespace layout is defined.
3. Key naming conventions and product-name guard are documented.
4. Formatting strategy uses `Intl` APIs.
5. Code patterns for the project-owned Vue i18n boundary are provided without selecting a runtime package.
6. Typed locale identifiers, HTML `lang`, Naive UI locale/date-locale synchronization, and validation rules are documented.

## Open questions / risks

- Whether additional languages (e.g., Traditional Chinese) are needed in phase one.
- Whether the legacy hard-coded Chinese strings require a migration extraction effort.

## Machine-readable summary

```json
{
  "document": "i18n-spec",
  "version": "1.0.0",
  "rules": [
    "all_user_facing_strings_keyed",
    "chinese_product_name_exact",
    "keys_namespaced_and_typed",
    "formatting_uses_intl_apis",
    "fallback_chain_predictable"
  ],
  "languages": ["zh-CN", "en"],
  "default_locale": "zh-CN",
  "fallback_chain": ["selected", "en", "key_name"],
  "runtime_package": "UNSELECTED",
  "boundary": "project-owned-vue-i18n",
  "namespaces": ["common", "workspace", "board", "pgn", "analysis", "competition", "display"],
  "forbidden_homophone": "U+51EF U+8D5B U+4E50",
  "related_docs": [
    "docs/ui/COMPONENT_SYSTEM_SPEC.md",
    "docs/ui/ACCESSIBILITY_SPEC.md",
    "docs/ui/PAGE_STYLE_SPEC.md",
    "docs/ui/UI_ACCEPTANCE_CHECKLIST.md"
  ],
  "next_doc": "docs/ui/UI_ACCEPTANCE_CHECKLIST.md"
}
```
