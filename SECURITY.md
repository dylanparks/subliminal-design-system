# Security policy

## Reporting a vulnerability

Please report security problems privately, not in a public issue:

1. Go to the repository's **Security** tab and choose **Report a vulnerability**.
2. Describe what you found, how to reproduce it, and what you think the impact is.

You'll get an acknowledgement within a few days. Please don't share details publicly until a fix
is available.

## Supported versions

The Subliminal Design System is pre-1.0. Only the latest release receives security fixes.

## What's in scope

- The published package (`subliminal-design-system`) and its `sds-build-tokens` command, which reads
  a ZIP or folder of design tokens.
- The documentation site at subliminaldesignsystem.com.

## What we already do

- The site is served with a strict Content-Security-Policy, HSTS and the usual hardening headers
  (`site/public/_headers`). The build fails if the policy would block anything in the built page.
- Dependencies are audited and kept current (Dependabot, weekly).
- No secrets are stored in the repository.
