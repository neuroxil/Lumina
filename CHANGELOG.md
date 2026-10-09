# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-10-09

### Added

- Local Windows authenticator with TOTP, HOTP, and Steam Guard
- PIN-encrypted vault (scrypt + AES-256-GCM)
- QR add (image and screen capture), otpauth URIs, and imports (Aegis, 2FAS, Bitwarden, Google Authenticator migration)
- Encrypted export, URI export, and local backups
- Tray icon, always-on-top window, auto-lock
- GitHub Actions CI and tagged Windows releases
