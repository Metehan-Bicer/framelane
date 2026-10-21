# Framelane

Design, localize and ship App Store screenshots and metadata from one self-hosted app.

> **Status:** early development. Screenshots and metadata work end to end; App Store Connect upload is next.
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
- [x] Screenshot editor: device frames, backgrounds, captions, layout templates, live preview
- [x] Export at the exact pixel sizes App Store Connect accepts (iPhone 6.9" and 6.5")
- [x] Per-language captions and screenshots
- [ ] iPad sets
- [ ] Optional AI translation with your own key or Ollama
- [x] Metadata editor with character counters, keyword tidying and a product page preview
- [x] Import and export for fastlane `metadata/` folders and EAS `store.config.json`
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
| `npm run render:sheet -- <dir> <out.png>` | Render every template with Node, handy when changing `src/lib/design/render.ts` |

Built with Next.js 16, React 19, Tailwind CSS 4, SQLite and Drizzle.

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
