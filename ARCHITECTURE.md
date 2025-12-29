# Architecture Overview

This repository is the Logseq plugin "show-weekday-and-week-number." Below is a concise architectural guide to enhance maintainability and reusability.

Main Directories
- `src/` - Main source code.
  - `lib/` - General utilities (UI helpers, date calculations, localization, etc.).
  - Functional modules separated by concerns, such as `journals/`, `calendar/`, `settings/`, `translations/`.

Design Principles (Brief)
- Utilities are centralized in `src/lib`. Common functions and types are exported from here.
- Avoid importing directly from external file paths; instead, use the barrel file `src/lib/index.ts` (e.g., `import { createElementWithClass } from '@/lib'`).
- Avoid creating too many small functions. Only promote processes used in multiple places to `lib`.
- Avoid breaking changes and stabilize the public API (function names and types).

Future Improvements
- Create `src/types.ts` to centralize shared types.
- Add unit tests to ensure the correctness of date logic.
