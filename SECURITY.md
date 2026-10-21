# Security

Framelane stores an App Store Connect API key, so please report security issues privately.

## Reporting

Use [GitHub's private vulnerability reporting](https://github.com/Metehan-Bicer/framelane/security/advisories/new).
Please do not open a public issue. You will get a reply within a few days.

## How keys are stored

- The `.p8` private key is encrypted with AES-256-GCM before it is written to the SQLite database.
- The encryption key comes from `FRAMELANE_SECRET`, or from `secret.key` in the data directory, created with
  `0600` permissions on first use.
- Keys are only sent to Apple, signed into short-lived (15 minute) ES256 tokens. They never reach the browser.

## Running it safely

Framelane has no user accounts. Before exposing it beyond your own machine, set `FRAMELANE_PASSWORD` (and optionally
`FRAMELANE_USERNAME`, default `admin`) to require HTTP Basic auth, and serve it over HTTPS. A reverse proxy with its
own authentication works too.
