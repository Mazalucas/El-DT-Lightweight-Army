# Auth Minimal Template

Max-width 400px centered card. System-agnostic structure.

## Wireframe

```text
┌─────────────────────────────────────┐
│           [Logo 32–40px]            │
│                                     │
│         Sign in to {Product}        │  ← h1, one line
│    Use your work email to continue  │  ← subtitle, optional
│                                     │
│  Email                              │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Password              [Forgot?]    │
│  ┌─────────────────────────────┐   │
│  │                         [👁]│   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │        Continue             │   │  ← primary full width
│  └─────────────────────────────┘   │
│                                     │
│  ─────────── or ───────────        │
│                                     │
│  [ Continue with Google    ]        │
│  [ Continue with Microsoft ]        │  ← max 2–3 SSO
│                                     │
│  No account? [Create one]           │
└─────────────────────────────────────┘
```

## Spec Notes

| Element | Spec |
|---------|------|
| Card padding | 24–32px |
| Field gap | 16px |
| Label | Always visible above field |
| Primary button | Full width, min-height 44px |
| Background | Neutral subtle (not gradient) |
| Error | Inline below field, `role="alert"` |

## States

- Default, loading (button spinner), field error, form error (banner only if multi-field)

## Mobile

- Full-width card with 16px horizontal margin
- Keyboard: scroll field into view

## System Mapping

| System | Card | Input | Button |
|--------|------|-------|--------|
| Carbon | Tile or standalone | TextInput | Button primary |
| Material | Paper elevation 1 | TextField | FilledButton |
| Polaris | Card | TextField | Button variant primary |
