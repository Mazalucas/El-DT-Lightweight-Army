---
name: auth-flows
description: "When designing login, signup, password reset, SSO, MFA, or authentication UI flows. Also use when the user mentions 'login page,' 'sign up,' 'auth flow,' 'OAuth buttons,' 'magic link,' or 'onboarding gate.' Pair with patterns/auth-minimal template."
metadata:
  version: 1.0.0
---

# Auth Flow Patterns

Authentication surfaces — clarity, trust, minimal friction. **Never neumorphism or heavy glass on forms.**

## Flow Types

| Flow | Key screens |
|------|-------------|
| Email/password | Login, signup, forgot password, reset |
| SSO | Provider buttons, domain discovery |
| Magic link | Email entry, check inbox, deep link landing |
| MFA | TOTP, SMS backup, recovery codes |

## Layout Pattern: Auth Minimal

- Centered card max-width 400px (see **ui-templates** auth-minimal)
- Product logo top; no marketing hero distraction
- Single column form; labels always visible
- Primary CTA full-width; secondary links below

## UX Rules

1. **Show password** toggle — accessible icon button
2. **Error messages** inline, specific — not red banner only
3. **SSO** — max 3 provider buttons + email fallback
4. **Signup** — collect minimum fields; defer profile to onboarding
5. **Loading** — disable submit, show progress on button

## Trust (fintech/health)

- Security microcopy near password field
- Link to privacy/terms near submit
- No social proof carousels on login — focus task

## Anti-Slop

- No split-screen marketing collage on login (defer to marketing landing)
- No gradient auth backgrounds (SLOP001)
- No placeholder-only inputs

## A11y

- Autocomplete attributes (`email`, `current-password`, `new-password`)
- Focus order logical; error announced
- Contrast on inputs 4.5:1 minimum

## DEFER Rules

- **frontend** — auth implementation, OAuth wiring
- **arquitecto** — auth backend, session policy
- **patterns/signup** (marketing skill) — conversion optimization of signup marketing page

## Related Skills

- **ui-templates** — auth-minimal.md
- **accessibility-design** — form a11y
- **systems/carbon-design** — enterprise auth modals
- **anti-slop** — auth page clichés
