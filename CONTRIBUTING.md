# Contributing

Thanks for helping out.

1. Open an issue first for anything larger than a small fix, so we can agree on the approach.
2. Fork, create a branch, and run `npm install`.
3. Make your change with tests. Before pushing, run `npm run lint`, `npm run typecheck`, `npm test`
   and, for UI changes, `npm run build && npm run test:e2e`.
4. Open a pull request describing what changed and why. Screenshots help for UI changes.

App Store rules (sizes, limits, locales) live in `src/lib/app-store/`. If Apple changes them, link the
official documentation in your pull request.
