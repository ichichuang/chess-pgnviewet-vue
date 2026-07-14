# Product UI Migration Gate Baseline

Status: `ACCEPTED`

Gate: `PRODUCT_UI_DEVELOPMENT_BASELINE_PASS`

## Accepted evidence

- One application shell owns viewport geometry.
- One canonical workspace renders board, PGN, annotation, and analysis
  behavior.
- Tournament list, detail, and big-screen routes are integrated without
  duplicating the workspace.
- Project tokens own visual values.
- Project-owned UI adapters own reusable component boundaries.
- Presentational components remain store-free.
- Source-specific remote states fail closed without fabricated data.

## Continuing gate

Future UI changes must preserve canonical interaction, keyboard behavior,
focus, reduced motion, responsive geometry, token ownership, and scroll
ownership. They require typecheck, production build, and one narrow
real-browser validation.
