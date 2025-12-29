# Contributing

This document summarizes the contribution process.

Local Setup (Recommended)
1. Clone the repository.
2. Install dependencies: `pnpm install` (or `npm install`).
3. Build/Develop: `pnpm build` or `pnpm dev` (if there are project-specific scripts).

Code Guidelines (Simplified)
- Follow the existing style (spaces/indentation, naming conventions).
- Add new utilities to `src/lib/` and include exports in `src/lib/index.ts`.
- Update `ARCHITECTURE.md` when making changes to the public API (function names, signatures).

Pull Requests
- Create PRs in small units.
- Include a short summary of changes (purpose, scope, regression tests, if any).

Contact
- For proposing major design changes, create an Issue to discuss.
