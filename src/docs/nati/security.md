# Security

Guidelines for protecting secrets and data.

## Keys & Secrets

- Store provider keys in Settings/Configure; avoid .env committed to VCS.
- Rotate keys periodically and on role changes.
- Prefer least-privilege API keys and scoped tokens.

## Storage

- Encrypt at rest where possible (DB, backups).
- Restrict access by role and environment (dev/stage/prod).
- Redact secrets in logs and UI.

## Network

- Use HTTPS/TLS everywhere.
- Validate webhooks (signatures, timestamps, replay protection).
- Apply rate limiting and bot protections.

## Development

- Use .gitignore for local secrets and artifacts.
- Run linters/scanners to catch hardcoded secrets.
- Add tests for auth, permissions, and input validation.

Tip: Treat all model prompts/outputs as untrusted; sanitize before use.
