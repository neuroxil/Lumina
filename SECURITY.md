# Security policy

Lumina stores 2FA secrets on disk. Treat crypto, vault, IPC, and export bugs as security issues.

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |

## How to report

Use GitHub **Privately report a vulnerability** on this repository (Security → Advisories → Report a vulnerability).

Do not open a public issue, pull request, or discussion for:

- Vault encryption / PIN / DPAPI handling
- Secrets leaking into the renderer, logs, crash dumps, or clipboard beyond intended copy
- Import / export that writes secrets in the clear unexpectedly
- IPC that can be invoked by a compromised renderer to dump the vault

Please include:

- Lumina version (or commit)
- Windows version
- What you expected vs what happened
- A minimal reproduction that does **not** include real account secrets

You should hear back within 7 days. Please give us time to ship a fix before public disclosure.

## What Lumina claims

- Codes are generated locally. There is no Lumina server.
- With a PIN set, `vault.json` is encrypted with scrypt (N=16384, r=8, p=1) and AES-256-GCM.
- The UI process is not given raw secrets; it receives rotating codes over IPC.

## What Lumina does not claim

- No third-party audit
- No code signing on default GitHub builds
- No protection against malware running as your Windows user
- PIN stretching is intentionally moderate so unlock stays fast; a strong PIN still matters
- Unsigned exports (no password) are plaintext by design

If you are choosing an authenticator for high-value accounts, read the code in `src/main/services/crypto.ts` and `src/main/services/vault.ts` yourself.
