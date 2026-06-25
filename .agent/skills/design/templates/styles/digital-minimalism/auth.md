> **IA:** implementá desde este Markdown — [`../../PROTOCOL.md`](../../PROTOCOL.md). No ejecutes scripts de preview.

# Digital Minimalism — Auth Template

Extiende `ui-templates/references/templates/auth-minimal.md`.

| Token / regla | Valor |
|---------------|-------|
| Card max-width | 400px |
| Background | `--color-bg` flat, no mesh |
| Card | surface + border 1px, shadow-sm o none |
| Fields | label visible, gap 16px |
| SSO | máx 2 providers, texto plano |
| Error | inline, no banner salvo form-level |

**Prohibido:** glass card, gradient backdrop, emoji icons.

```text
        ┌─────────────────────┐
        │ Logo                │
        │ Sign in             │
        │ email               │
        │ password            │
        │ [ Continue ]        │
        │ or · Google         │
        └─────────────────────┘
```
