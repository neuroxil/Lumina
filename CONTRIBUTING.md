# Contributing to Lumina

Thanks for helping. Lumina is a local Windows 2FA app — keep secrets out of git, issues, and screenshots.

## Development

You need Node.js 20+ (22 matches CI).

```bash
npm install
npm test
npm run typecheck
npm run dev
```

## Guidelines

- Keep changes focused. A PR should do one thing.
- OTP math and importers live in `src/shared/` and should have tests (`src/shared/*.test.ts`).
- Secrets never belong in the renderer. If you add IPC, return codes or public metadata, not raw secrets.
- Do not commit `vault.json`, exports, backups, `.env`, certificates, or real `otpauth://` URIs.
- Match existing TypeScript, React, and Tailwind style. No new UI library without a discussion.

## Pull requests

1. Fork and branch from `main`
2. Add or update tests when you change OTP, parsing, or crypto
3. Run `npm test` and `npm run typecheck`
4. Fill in the pull request template

## Issues

Use the bug or feature templates. For anything that could leak secrets, follow [SECURITY.md](SECURITY.md) instead of filing a public issue.

## License

By contributing, you agree your work is licensed under the [MIT License](LICENSE).
