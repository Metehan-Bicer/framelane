# Framelane

Design, localize and ship App Store screenshots and metadata from one self-hosted app.

> **Status:** early development. The app shell and data model are in place; the screenshot editor is next.
> Follow the roadmap below or watch the repo for the first release.

## Why

Shipping an app update means framing screenshots for every device size, translating captions and store text
for every language, and uploading it all to App Store Connect. Today that is a design tool, a spreadsheet and
fastlane glued together. Framelane does the whole flow in one place, runs on your own machine, and talks to
App Store Connect with your own API key.

## Roadmap

**v0.1**

- [x] Apps with bundle ID and languages
- [x] App Store rules: screenshot sizes, metadata limits, supported locales
- [ ] Screenshot editor: device frames, backgrounds, captions, layout templates, live preview
- [ ] Export at the exact pixel sizes App Store Connect accepts
- [ ] Per-language captions and screenshot sets, optional AI translation with your own key or Ollama
- [ ] Metadata editor with character counters, import and export for fastlane and EAS formats
- [ ] Upload metadata and screenshots to App Store Connect, with a dry run diff first

**Later:** keyword suggestions, Google Play, shared templates, CLI and MCP server.

## Run it

With Docker:

```bash
docker compose up -d
```

Framelane is now on http://localhost:8300. Data lives in the `framelane-data` volume.

For development (Node 22+):

```bash
npm install
npm run dev
```

## Development

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright, needs `npm run build` first) |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |

Built with Next.js 16, React 19, Tailwind CSS 4, SQLite and Drizzle.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
