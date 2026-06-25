> **IA:** implementá desde este Markdown — [`../../PROTOCOL.md`](../../PROTOCOL.md). No ejecutes scripts de preview.

# Glassmorphism — Nav Overlay Template

Floating nav bar — max height 56px, horizontal padding 24px.

```text
┌────────────────────────────────────────────────────────────┐
│  (margin top 16px)                                         │
│    ╭──────────────────────────────────────────────────╮    │
│    │ Logo    Link   Link   Link          [ Solid CTA ]│    │
│    ╰──────────────────────────────────────────────────╯    │
│    glass-panel · blur 16px · border 1px                    │
└────────────────────────────────────────────────────────────┘
```

## Mobile

- Full-width glass bar fixed top
- Hamburger + logo; sheet modal opaque for menu items (legibility)

## Performance

- Un solo `backdrop-filter` en viewport cuando sea posible
- Evitar glass sobre glass
