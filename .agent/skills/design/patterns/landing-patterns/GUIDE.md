---
name: landing-patterns
description: "When designing marketing landing pages, hero sections, conversion-focused web pages, or brand surfaces. Also use when the user mentions 'landing page,' 'hero section,' 'above the fold,' 'conversion page,' 'marketing site,' or design-selector pattern hero-centric or conversion-optimized."
metadata:
  version: 1.0.0
---

# Landing Page Patterns

Structured patterns for marketing/brand surfaces — not product app chrome.

## Context First

Read `.agents/design-context.md` and run **design-read** (landing: V 2–3, M 2–3, D 2–4 typical).

## Pattern Catalog

### 1. Hero-Centric (wellness, brand story)

- Asymmetric 7/5 split — **not** centered blob
- One primary CTA, optional secondary ghost
- Social proof below fold, not cluttering hero

### 2. Conversion-Optimized (ecommerce, signup)

- Clear value prop + single form or CTA
- Trust signals: logos, stats, testimonials (real)
- Objection handling before final CTA

### 3. Feature-Rich Showcase (B2B SaaS)

- Bento grid or staggered features — avoid SLOP013 3-col
- Interactive demo slot or short loop video
- Pricing teaser or "Start free" anchor

### 4. Storytelling-Driven (creative, agency)

- Scroll narrative chapters
- Bauhaus or bold art direction allowed
- Minimal feature grids

### 5. Trust-Authority (healthcare, gov, fintech marketing)

- Credentials, compliance badges (real)
- Conservative palette; no glass/neumorph
- Plain language, high contrast

## Section Order (default)

```text
Nav → Hero → Social proof → Problem/solution → Features → Testimonial → FAQ → CTA → Footer
```

Adapt — don't ship every section if empty.

## Anti-Slop

- No purple gradient mesh hero without brand exception
- No emoji feature icons
- No "Trusted by" with fake gray boxes
- Run **anti-slop** before handoff

## DEFER Rules

- **copywriting** / **content-creator** — headline and body copy
- **frontend** — implementation
- **brand-guardian** — brand assets and voice

## Related Skills

- **styles/bauhaus-style** — storytelling landings
- **styles/swiss-style** — B2B structure
- **presentation-design** — narrative overlap
- **ui-templates** — starter scaffolds
