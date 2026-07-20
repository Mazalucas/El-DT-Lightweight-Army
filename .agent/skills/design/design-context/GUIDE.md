---
name: design-context
description: "When the user wants to create or update unified design context for a project. Also use when the user mentions 'design context,' '.agents/design-context.md,' 'design dials,' 'anti-patterns,' 'visual direction,' 'design brief,' or needs foundational product+design context before other Atelier skills. Creates `.agents/design-context.md` — imports `.agents/product-marketing.md` if it exists. Use at the start of any design work before design-selector or system/style skills."
metadata:
  version: 1.0.0
---

# Design Context

You help users create and maintain `.agents/design-context.md` — the single source of truth for product positioning, visual direction, dials, and anti-patterns. Other Atelier skills read this file first.

## Initial Assessment

1. Check for `.agents/design-context.md` (also legacy `.claude/design-context.md`).
2. If `.agents/product-marketing.md` exists, **import** positioning, audience, and tone — do not duplicate; link and extend with design-specific fields.
3. If neither exists, offer auto-draft from codebase + brief interview.

## Workflow

### Step 1: Gather or Update

**If exists:** Summarize sections; ask what to update.

**If new:** Auto-draft from README, existing UI, brand assets, or walk through schema in `references/context-schema.md`.

**If task is presentation/deck:** Run **brand manual gate** first — see `references/brand-manual-checklist.md`. Do not skip even if design-context exists without Brand manual section.

### Step 2: Write Document

Follow `references/context-schema.md`. Required sections:

- **Product snapshot** — one-liner, category, primary users (from product-marketing if available).
- **Surfaces** — landing vs product vs deck; priority surface for current work.
- **Design dials (V/M/D)** — Visual density, Motion, Depth (1–5 each; see design-read skill).
- **System + style** — current or TBD; note ecosystem lock-in (Shopify, Atlassian, etc.).
- **Tokens summary** — primary palette, type stack, radius, spacing baseline.
- **Anti-patterns** — explicit exclusions (e.g. no purple gradients, no Inter default).
- **Brand manual** — logo, palette, typography, tone, restrictions (required before deck generation; see `references/brand-manual-checklist.md`).
- **A11y baseline** — AA default; AAA if gov/health/fintech signals.

### Step 3: Validate

- Dials are justified (not all 3s).
- Anti-patterns are specific, not generic "make it nice."
- Ecosystem lock-in documented if applicable.

## Protocol

- **No cómplice:** If dials conflict (e.g. glassmorphism + a11y AA + fintech), flag and resolve before saving.
- **Alternativas:** Offer 2 visual directions when brief is vague; user picks one to encode.

## Anti-Slop Notes

- Default minimalism is high slop risk — require explicit anti-patterns.
- Never leave `typography: Inter` without brand justification in anti-patterns or tokens.

## DEFER Rules

- **brand-guardian** — logo usage, brand book, voice/tone beyond product-marketing.
- **frontend** — implementation, component code, CSS output.
- **product-marketing** — if positioning/ICP missing, defer to create product-marketing first.

## Related Skills

- **design-selector** — recommends system/style from brief + this file
- **design-read** — quick V/M/D check before sessions
- **design-tokens** — expands tokens section into CSS/theme
- **anti-slop** — validates against anti-patterns list
