# Apple HIG — Summary

## Platform Layout

| Device | Pattern |
|--------|---------|
| iPhone | Tab bar or single-stack navigation |
| iPad | Split view, sidebar + detail |
| macOS | Sidebar, toolbar, keyboard shortcuts |
| visionOS | Ornaments, spatial panels, glass with depth purpose |

## Typography

- SF Pro (UI), New York (reading)
- Use text styles: `.title`, `.headline`, `.body` — not arbitrary px on native

## Materials

- Ultra-thin to thick material for blur backgrounds
- Vibrancy for text on materials
- Web imitation: limit blur; provide opaque fallback

## Components

- Lists: inset grouped style for settings
- Buttons: bordered prominent, plain, destructive roles
- Alerts: system Alert — don't custom modal for standard confirmations

## SF Symbols

- Match weight to adjacent text
- Multicolor only when semantic (weather, health)

## Slop Avoidance

```markdown
❌ Web clone of iOS with rounded everything + fake notch hero
✅ Platform-native patterns OR honest web design with different system
```

## Links

- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
