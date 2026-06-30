# Atlassian Design — Summary

## Surfaces

| Host | Density | Notes |
|------|---------|-------|
| Jira issue view | High | Inline edits, compact metadata |
| Confluence page | Medium | Reading width, macros |
| Admin settings | Medium | Form-heavy |
| Forge modal | Low–medium | Short tasks |

## Key Atlaskit Packages

- `@atlaskit/button`, `@atlaskit/modal-dialog`
- `@atlaskit/page`, `@atlaskit/page-header`
- `@atlaskit/form`, `@atlaskit/select`
- `@atlaskit/table-tree` / dynamic table patterns

## Typography

- Charlie Sans (ADS refresh) — follow host product version
- Use ADS heading tokens, not arbitrary sizes

## Color

- Neutral backgrounds; accent for primary actions
- Status colors: success, warning, danger, info — semantic only

## Layout

- Page header + action buttons
- Sidebar filters where host provides pattern
- Max width for readable prose in Confluence

## Slop Avoidance

```markdown
❌ Bootstrap app inside Jira with purple gradient header
✅ Atlaskit Page + ADS tokens, blend with host chrome
```

## Links

- [Atlassian Design System](https://atlassian.design/)
- [Forge UI kit](https://developer.atlassian.com/platform/forge/ui-kit/)
