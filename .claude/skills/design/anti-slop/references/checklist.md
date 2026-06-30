# Anti-Slop Checklist

Use for code scan (via script) or manual mockup review.

## Visual Signatures (High Slop)

- [ ] Purple/violet/indigo gradient hero (`#6366f1`, `#8b5cf6`, mesh gradients)
- [ ] "Inter" or system-ui as only font with no brand story
- [ ] Three equal columns with centered icons + short blurbs
- [ ] Glass cards on glass background (>30% UI with backdrop-blur)
- [ ] Neumorphism on forms, inputs, or full pages
- [ ] Pure `#000` text/backgrounds (use tinted neutrals)
- [ ] Dark glow shadows on light backgrounds
- [ ] Side accent border tabs (purple left border active state)

## Layout Clichés

- [ ] Hero: headline + subhead + two CTAs + gradient blob
- [ ] "Trusted by" logo strip with gray placeholders
- [ ] Feature grid always `grid-cols-3`
- [ ] Card inside card (nested elevation)
- [ ] Dashboard with sidebar + empty chart placeholders only

## Typography

- [ ] All caps section labels with wide letter-spacing (overused)
- [ ] Body text below 14px on product UI
- [ ] Gray-400/500 text on colored buttons or gradients

## Motion

- [ ] Bounce or elastic easing on hovers
- [ ] Autoplay carousels without pause control
- [ ] Animations with no `prefers-reduced-motion` fallback

## Icons & Imagery

- [ ] Emoji used as UI icons (🔥 📊 ✅)
- [ ] Generic undraw/placeholder illustration style mismatch
- [ ] Stock photo heroes unrelated to product

## Accessibility Smells

- [ ] `div` with `onClick` but no `role`, keyboard, or focus ring
- [ ] Color-only state indicators
- [ ] Placeholder as only label on inputs
- [ ] Touch targets < 44×44px on mobile

## Intentional Exceptions

Document in `.agents/design-context.md`:

```markdown
## Approved exceptions
- Inter: licensed brand font per style guide v2
- Purple gradient: trademark brand asset section X only
```

## Fix Patterns

| Slop | Better |
|------|--------|
| Purple gradient hero | Solid brand primary + subtle texture or photography |
| Inter default | IBM Plex, Geist, Source Sans — match design system |
| 3-col features | 2-col asymmetric or bento grid with hierarchy |
| Glass everywhere | Opaque surfaces; glass only on modal chrome ≤30% |
| Pure black | `#0a0a0f` or slate-950 |
