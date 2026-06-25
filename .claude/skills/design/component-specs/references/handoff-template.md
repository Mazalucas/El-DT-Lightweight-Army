# Component Handoff Template

Copy per component. Save to `docs/` or attach to issue/PR.

---

## {ComponentName}

**Status:** draft | ready | implemented  
**System:** carbon-design | custom  
**Owner:** ui-designer → frontend

### Purpose

One sentence: when to use vs alternatives.

### Anatomy

```text
┌─────────────────────────────┐
│ [Leading icon?]  Label  [×] │
│ ─────────────────────────── │
│ Content area                │
│ [Secondary]    [Primary]    │
└─────────────────────────────┘
```

| Part | Element | Token |
|------|---------|-------|
| Container | div/Card | `--color-surface`, `--radius-md` |
| Primary action | Button | `--color-accent` |

### Variants

| Variant | Use |
|---------|-----|
| default | … |
| compact | … |
| destructive | … |

### States

| State | Visual | Behavior |
|-------|--------|----------|
| default | | |
| hover | | |
| focus | visible ring 2px `--color-accent` | |
| disabled | opacity 0.5 | no pointer events |
| loading | spinner in button | aria-busy |
| error | border `--color-error` | aria-invalid |

### Responsive

| Breakpoint | Change |
|------------|--------|
| mobile | full width |
| desktop | max-width per context |

### Accessibility

- Role: `button` / native `<button>`
- Keyboard: Enter/Space activate; Esc closes if modal
- Screen reader: label text, error announced
- Contrast: 4.5:1 minimum on all states

### Anti-Slop Check

- [ ] No nested card wrapper without purpose
- [ ] No emoji icons
- [ ] Matches design-context anti-patterns

### Acceptance Criteria

- [ ] All states implemented
- [ ] Focus visible
- [ ] Tokens used (no hardcoded hex in components)
- [ ] Responsive at 375px and 1024px

### References

- Figma: [link if any]
- System docs: [Carbon Button link]
- Related: {OtherComponent}

---
