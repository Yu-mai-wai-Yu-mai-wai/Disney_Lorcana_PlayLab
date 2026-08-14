# Design — Disney Lorcana PlayLab Cloud

A locked design system for this app. Every page redesign reads this file before emitting code.
Do not regenerate per page — extend or amend this file when the system needs to grow.
Status: locked 2026-08-13 (Dark Editorial Storybook, de-slop pass R2).

## Genre
**Atmospheric-Editorial** — typography leads (storybook), dark discipline (minimal),
real texture instead of effects (atmospheric). The card art and Cinzel headings are the stars;
effects are rationed.

## Core Principle
"Let the card art and typography speak. Effects are rationed."
- Remove: glassmorphism blur panels, emoji in UI copy, decorative glow shadows, shimmer sweeps,
  per-element gradients, constant animate-pulse/spin, 83 rounded-2xl/3xl everywhere.
- Keep: one accent (gold), solid surfaces, real foil-light simulation on card hover ONLY,
  motion only at meaningful moments (card flip, turn change).

## Macrostructure family
- Marketing pages (GameHub): Editorial Hero — serif headline + full-bleed art collage, no center-stack filler.
- App pages (Board, DeckBuilder, Analytics, UserDashboard): Workbench — dense, functional, solid panels.
- Content pages (RulesGuide): Long Document — typographic, numbered sections.

## Theme (OKLCH)
- `--color-paper`      oklch(0.16 0.02 260)   /* deepest canvas #0B0F19-ish */
- `--color-paper-2`    oklch(0.20 0.02 260)   /* panel surface */
- `--color-paper-3`    oklch(0.24 0.02 260)   /* elevated / hover */
- `--color-ink`        oklch(0.93 0.01 260)   /* primary text */
- `--color-ink-2`      oklch(0.72 0.015 260)  /* secondary text */
- `--color-ink-3`      oklch(0.55 0.015 260)  /* muted text */
- `--color-rule`       oklch(0.30 0.015 260)  /* borders — thin, solid, no glow */
- `--color-accent`     oklch(0.79 0.16 85)    /* gold #F59E0B — THE single accent */
- `--color-accent-ink` oklch(0.16 0.05 85)    /* text on accent */
- `--color-focus`      oklch(0.79 0.16 85)    /* focus ring = accent */

## Typography
- Display: Cinzel, weight 700-900, style normal. NEVER italic. Tracking wide on small sizes, normal on display sizes.
- Body: Outfit, weight 400-700.
- Mono: JetBrains Mono, weight 400-700 (for numbers, stats, tags, ids).
- Type scale anchor: `--text-display` = clamp(2.25rem, 5vw, 4rem) — used ONLY for page heroes.
- Headings: hierarchy via SIZE + WEIGHT, not color + glow.

## Spacing
4-point named scale (tokens.css): `--space-3xs` 0.25rem … `--space-3xl` 7rem.
Cards use `--space-md` (1.5rem) padding; section gaps `--space-xl` (3rem) minimum.
One radius system: `--radius-card` 12px, `--radius-pill` 9999px, `--radius-input` 8px.
NO radius larger than 12px on surfaces (kills the "everything is a blob" look).

## Motion
- Easings: `--ease-out` cubic-bezier(0.16, 1, 0.3, 1); `--ease-in-out` cubic-bezier(0.65, 0, 0.35, 1).
- Reveal pattern: fade only, ≤ 250ms. No scroll-triggered bounce/slide chains.
- Allowed motion: card flip (BoosterPack/Card3D), drag feedback, turn change, modal enter.
- Banned: decorative infinite spin/pulse/bounce on icons, shimmer sweeps, hover scale on whole cards.
- Reduced-motion fallback: opacity-only, ≤ 150ms (already in index.css — keep it).

## Microinteractions stance
- Silent success (no celebratory toasts; inline success text).
- Hover delay 800ms for tooltips, 0ms for focus.
- Buttons: solid accent fill for PRIMARY only; ghost/outline for everything else.
- One gradient max per viewport (primary CTA only).

## CTA voice
- Primary CTA: solid gold (`--color-accent`), `--color-accent-ink` text, radius 12px, Cinzel 700 caps.
- Secondary CTA: outline (1px `--color-rule`), ink text, radius 12px. Hover: border → accent.
- Never: gradient-to-r purple/indigo buttons, glowing borders, scale-on-hover.

## Status colors (contextual only, never decorative)
- success oklch(0.72 0.15 150) · warning oklch(0.85 0.15 95) · danger oklch(0.62 0.2 25)
- Used as small solid text/pills, NOT as glowing bars or pulsing dots.

## Ink color identity (card game — keep, but as badges only)
- Amber/Amethyst/Emerald/Ruby/Sapphire/Steel → small mono badges with colored text + 1px border,
  NO glow, NO gradient backgrounds.

## Per-page allowances
- Marketing pages (GameHub) MAY use enrichment: real card art collage, editorial image hero.
- App pages MUST NOT use enrichment — function carries the page.
- Content pages (RulesGuide): typography only.

## What pages MUST share
- The wordmark (LORCANA PLAYLAB, Cinzel 700, gold accent word if any).
- The accent colour and its placement (≤ 5% per viewport).
- Display + body fonts, CTA voice, radius system.
- Solid `--color-paper-2` surfaces (NO backdrop-blur panels).

## What pages MAY differ on
- Macrostructure within the page-type family.
- Hero archetype (marketing only).
- Density (Board is denser than Rules).

## Exports

### tokens.css (reference)
```css
:root {
  --color-paper:      oklch(0.16 0.02 260);
  --color-paper-2:    oklch(0.20 0.02 260);
  --color-paper-3:    oklch(0.24 0.02 260);
  --color-ink:        oklch(0.93 0.01 260);
  --color-ink-2:      oklch(0.72 0.015 260);
  --color-ink-3:      oklch(0.55 0.015 260);
  --color-rule:       oklch(0.30 0.015 260);
  --color-accent:     oklch(0.79 0.16 85);
  --color-accent-ink: oklch(0.16 0.05 85);
  --color-focus:      oklch(0.79 0.16 85);
  --color-success:    oklch(0.72 0.15 150);
  --color-warning:    oklch(0.85 0.15 95);
  --color-danger:     oklch(0.62 0.2 25);

  --font-display: "Cinzel", serif;
  --font-body: "Outfit", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  --space-3xs: 0.25rem; --space-2xs: 0.5rem; --space-xs: 0.75rem;
  --space-sm: 1rem; --space-md: 1.5rem; --space-lg: 2rem;
  --space-xl: 3rem; --space-2xl: 4.5rem; --space-3xl: 7rem;

  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-md: 1.125rem;
  --text-lg: 1.375rem; --text-xl: 1.75rem; --text-2xl: 2.25rem;
  --text-display: clamp(2.25rem, 5vw, 4rem);

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-short: 220ms;
  --radius-card: 12px; --radius-pill: 9999px; --radius-input: 8px;
}
```

### Tailwind v4 `@theme` mapping (in src/index.css)
```css
@theme {
  --color-paper:  oklch(0.16 0.02 260);
  --color-paper-2: oklch(0.20 0.02 260);
  --color-paper-3: oklch(0.24 0.02 260);
  --color-ink:    oklch(0.93 0.01 260);
  --color-ink-2:  oklch(0.72 0.015 260);
  --color-ink-3:  oklch(0.55 0.015 260);
  --color-rule:   oklch(0.30 0.015 260);
  --color-accent: oklch(0.79 0.16 85);
  --color-accent-ink: oklch(0.16 0.05 85);
  --font-display: "Cinzel", serif;
  --font-body: "Outfit", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --radius-card: 12px; --radius-pill: 9999px; --radius-input: 8px;
}
```

## Magic Enrichment (Landing only) — Dark Editorial + Magic pass R3
Status: added 2026-08-14 (user-approved direction A: keep Dark Editorial frame, add restrained "Disney magic" taste to marketing pages).

### Allowed (Marketing pages ONLY: GameHub, any future landing/hero)
- `.magic-glow-gold` — soft gold light rising from card art behind the hero. Blur ≤ 60px, opacity ≤ 0.25, radial, NON-interactive, `pointer-events-none`. One instance per viewport.
- `.magic-parchment` — subtle noise/parchment texture on the hero backdrop (same family as the existing body noise; opacity ≤ 0.05).
- `.foil-text` — gold gradient text on the hero headline ONLY (one gradient per viewport — respects the existing ≤1 gradient rule by REPLACING the CTA gradient allowance on marketing pages).
- `.magic-divider` — thin gold rule + tiny sparkle glyph (lucide `Sparkles`, NOT emoji), used between hero sections.
- Real card art as hero backdrop (already in ArtworkCarousel) — keep.

### Still BANNED everywhere (incl. landing)
- glassmorphism blur panels, emoji in UI copy, decorative glow on buttons/cards, shimmer sweeps,
  gradient text outside the single hero headline, animate-pulse/spin on decoration, rounded-3xl surfaces.

### App pages (Board/DeckBuilder/Analytics)
- NO enrichment. Function carries the page. Board UX polish (scroll, drag-choice menu) is functional work, not decoration.

## Anti-slop checklist (verify before ship)
- [ ] 0 emoji in UI copy (lucide icons + text only)
- [ ] 0 backdrop-blur panels on surfaces (solid paper-2)
- [ ] 0 decorative animate-pulse/spin/bounce (except card flip/drag/turn)
- [ ] 0 shimmer classes
- [ ] 0 glow shadows (`shadow-[0_0_...]`) except foil-light on card hover + `.magic-glow-gold` hero light
- [ ] ≤1 gradient per viewport (hero foil-text on marketing; primary CTA elsewhere)
- [ ] radius ≤ 12px on surfaces
- [ ] Cinzel headings never italic; hierarchy via size/weight
- [ ] aria-labels preserved (R1 work not regressed)
