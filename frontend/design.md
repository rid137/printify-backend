# Printify design system

Visual source of truth for the Printify frontend. Implement tokens in CSS; do not scatter raw hex values across components.

## Brand character

Warm, premium, calm, editorial, tactile, and product-focused. Cream paper, harvest orange, and ink — not generic blue/purple SaaS.

The **landing page** is a marketing website: spacious, centered, editorial, product-led.

The **authenticated app** is a productivity workspace: denser, sidebar + top bar, data-first. Same tokens, different architecture.

## Color tokens

| Name | Hex | Role |
| --- | --- | --- |
| Harvest Flame | `#fa5d00` | Primary accent, primary actions, selected state |
| Marigold Glow | `#fee3b5` | Soft highlight, hero wash |
| Parchment Shadow | `#e3d6c5` | Light borders, dividers |
| Ink Black | `#1d1e1c` | Light-theme primary text and icons |
| Paper White | `#ffffff` | Elevated light surfaces (never the page background) |
| Cream Canvas | `#fff8f1` | Light page background |
| Mist Gray | `#d9d9d9` | Disabled / hairline |
| Warm Stone | `#615f5c` | Secondary text |
| Driftwood | `#8e8b87` | Tertiary text, captions |
| Ironwood | `#4a4a47` | Strong secondary |
| Ash | `#777571` | Muted labels |
| Bone | `#c0bbb6` | Subtle fills |
| Smoke | `#a5a19c` | Placeholder |
| Graphite | `#999999` | Metadata |

### Light theme (semantic)

- Page: Cream Canvas
- Surface: Paper White
- Text: Ink Black
- Muted text: Warm Stone / Driftwood
- Border: Parchment Shadow
- Accent: Harvest Flame
- Shadow: warm, soft (`rgba(29, 30, 28, 0.08)`)

### Dark theme (semantic)

Preserve the same identity. Do not use pure black or generic slate.

- Page: `#1a1816` deep warm charcoal
- Surface: `#24211e` slightly lighter charcoal
- Text: `#f4efe8` warm off-white
- Muted text: `#b7b1a9`
- Border: `#3a3530`
- Accent: Harvest Flame (unchanged)
- Shadow: `rgba(0, 0, 0, 0.35)`

Orange is the only brand accent. Do not introduce blue, purple, or rainbow icon colors.

## Typography

**UI / body / dashboard** (sans): MuotoWeb, fallback Inter / system-ui.

**Hero display only** (serif): Monarch, fallback Newsreader / Georgia / serif.

Monarch/Newsreader is reserved for marketing hero headlines. Do not use serif throughout the dashboard, forms, tables, or navigation.

### Scale

| Use | Size | Tracking | Weight |
| --- | --- | --- | --- |
| Marketing hero | 56–72px | tight | 500 |
| Marketing section | 32–40px | tight | 500 |
| App page title | 22–24px | normal | 600 |
| Card title | 16–18px | normal | 600 |
| Body | 15–16px | normal | 400 |
| Label / meta | 12–13px | wide | 500 |

Line height: generous on marketing copy (~1.5–1.6), compact on app tables (~1.4).

## Shape and space

- Radius: 12px default surfaces, 10px controls, 8px chips. Avoid pill-everything.
- Spacing: 8px grid. Marketing sections 80–120px vertical padding. App content 24–32px.
- Shadows: few, warm, low elevation. Cards lift slightly; do not stack glow.

## Iconography

Single geometric set (Lucide). Default color is ink (or dark-mode off-white). Orange only for primary/selected/brand moments.

## Components

Buttons, inputs, cards, tables, badges, pagination, dialogs, and toasts share these tokens. Marketing and app shells must not share layout structure.

## Do not

- White as the global light page background
- Pure black as primary text
- Oversized serif in the dashboard
- Gradients, glassmorphism, or purple/blue palettes
- Dashboard sidebar on the landing page
- Marketing hero layout inside the app shell
