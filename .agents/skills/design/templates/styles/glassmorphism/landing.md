> **IA:** implementá desde este Markdown — [`../../PROTOCOL.md`](../../PROTOCOL.md). No ejecutes scripts de preview.

# Glassmorphism — Landing Template

**Cuota glass:** ≤30% viewport · **Requiere** fondo rico (foto/gradient con intención de marca)

```text
┌──────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░ full-bleed background (photo or brand gradient) ░│
│  ┌ glass nav ─────────────────────────────────────────────┐  │
│  │ logo                          links        [cta solid] │  │
│  └──────────────────────────────────────────────────────┘  │
│        ┌──────── glass card ────────┐                        │
│        │ headline (text-shadow min) │                        │
│        │ subhead                    │                        │
│        │ [ solid CTA — not glass ]  │                        │
│        └────────────────────────────┘                        │
│  content below on solid/scrim section (legibility)           │
└──────────────────────────────────────────────────────────────┘
```

## Reglas

- CTA primario: botón **sólido** (no glass) para contraste
- Texto sobre glass: scrim `rgba(0,0,0,0.3)` bajo texto si foto variable
- Máx 2–3 paneles glass visibles
- `prefers-reduced-transparency`: fallback opaco (ver tokens)

## Anti-patterns

- Purple mesh default sin marca
- Todas las cards glass
- Fondo blanco plano (glass invisible)

## Pairing

- `systems/apple-hig` — materiales nativos preferidos sobre CSS custom
