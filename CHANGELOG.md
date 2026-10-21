# Changelog

All notable changes are listed here. The project follows [Semantic Versioning](https://semver.org).

## 0.1.1

- Public demo mode (`FRAMELANE_DEMO=1`): App Store Connect is turned off, a banner links to the quick start, and the
  data resets to the Daybook demo on start and every night at 03:00.
- `npm run seed:demo` shares its code with the demo reset.
- README animation of the editor and metadata flow.

## 0.1.0

First release.

### Screenshots
- Apps with bundle ID and languages.
- Screenshot editor with four templates (Headline, Footnote, Tilt, Full bleed), drawn device frames, palettes,
  gradient or solid backgrounds and five caption fonts.
- Captions and source screenshots per language, falling back to the primary language.
- `*word*` highlighting in titles.
- Export of every language at the exact App Store sizes for iPhone 6.9" and 6.5", as a zip.

### Metadata
- Product page text per language with App Store character limits.
- Keyword helper that tidies the list and flags words the name and subtitle already cover.
- Product page preview built from your frames.
- Import and export for fastlane `metadata/` folders and EAS `store.config.json`.

### Publishing
- App Store Connect API key, checked with Apple and stored encrypted (AES-256-GCM).
- Field by field diff before anything is sent; empty fields never erase existing text.
- Screenshot sets replaced per language using Apple's upload operations.

### Running it
- Docker image for amd64 and arm64 on GitHub Container Registry, SQLite storage in one volume.
