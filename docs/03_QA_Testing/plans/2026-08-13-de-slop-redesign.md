# De-Slop Redesign — Disney Lorcana PlayLab Cloud Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Disney Lorcana PlayLab Cloud according to `design.md` ('Dark Editorial Storybook'), eliminating all AI-slop elements (gradients, glassmorphism blur panels, emoji in UI copy, decorative pulse/spin animations, colored glow shadows, shimmer sweeps, rounded-2xl/3xl overuses) while strictly keeping all game logic, state management, accessibility attributes, and component structures intact.

**Architecture:** Tailwind CSS v4 `@theme` configuration with OKLCH tokens, solid surface panels (`--color-paper-2`), typography-led hierarchy (Cinzel + Outfit + JetBrains Mono), flat ink identity badges, and controlled hover interactions (`.card-foil-light`).

**Tech Stack:** React 19, Vite 6, TypeScript (strict), Tailwind CSS v4, Lucide Icons, Framer Motion.

## Global Constraints

- Do NOT change game logic, drag thresholds, turn system, quest rules, websocket, store, types, backend, or any behavior.
- Do NOT regress R1 a11y work: keep all aria-labels (>=24), role=button/tabIndex/keyboard handlers, Modal.tsx usage, :focus-visible ring, prefers-reduced-motion block.
- Do NOT add npm dependencies. Do NOT delete files. In-place visual edits only.
- No emoji in UI copy anywhere (replace with lucide icons already imported, or plain text).
- Cinzel headings: normal style, hierarchy via size/weight only, never italic, never gradient text.
- Keep the Lorcana ink identity: Amber/Amethyst/Emerald/Ruby/Sapphire/Steel as small mono badges with colored text + 1px border (NO glow, NO gradient bg).

---

### Task 1: Design System & CSS Rewrite (`src/index.css`)

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Consumes: OKLCH design tokens from `design.md`.
- Produces: `@theme` variables, solid surface classes (`.glass-panel`, `.glass-panel-heavy`, `.ether-panel`), `.card-foil-light`, clean ink badges, noise texture background.

- [ ] **Step 1: Replace `@theme` and base styles in `src/index.css`**
  Define OKLCH tokens for paper, paper-2, paper-3, ink, ink-2, ink-3, rule, accent, accent-ink, fonts, and radii. Add subtle SVG noise data-URI body background.
- [ ] **Step 2: Remove slop utility classes and replace with solid design system utilities**
  Delete `.shimmer`, `.shimmer-button-amber`, `.shimmer-button-purple`, `.amethyst-glow`, `.card-foil-sheen`, `.magic-border-amber`, `.magic-border-purple`.
  Repoint `.glass-panel`, `.glass-panel-heavy`, `.ether-panel`, `.glass-nav-header` to solid `#141a26` / `var(--color-paper-2)` backgrounds with solid `var(--color-rule)` borders and standard non-glowing shadows.
  Define `.card-foil-light` (thin gold border + subtle sheen on hover ONLY).
  Keep `.playmat-bg` (solid dark canvas `#0B0F19`), `.exerted`, `.no-scrollbar`, `.data-font`, clean ink badges, `:focus-visible`, and `prefers-reduced-motion`.
- [ ] **Step 3: Run lint and build to verify CSS compilation**
  Run `npm run build` to verify Tailwind v4 compiles `@theme` without syntax errors.

---

### Task 2: Navbar Component De-slop (`src/components/Navbar.tsx`)

**Files:**
- Modify: `src/components/Navbar.tsx`

**Interfaces:**
- Consumes: Navbar props (`currentTab`, `setTab`, `deckCount`, etc.).
- Produces: Editorial header UI with 1px underline active indicators.

- [ ] **Step 1: Remove gradient backgrounds, scale transforms, and glow shadows from active/inactive tab buttons**
  Active tab: accent text color (`text-[#F59E0B]`) + thin 1px bottom border/underline (`border-b-2 border-[#F59E0B]`).
  Inactive tab: `text-[#94A3B8]` (ink-2), hover: `text-white` (ink).
  Header background: solid dark panel (`bg-[#0B0F19]` or `bg-[#141a26]` with `border-b border-[#30363d]`), remove `glass-nav-header` and `backdrop-blur`.
- [ ] **Step 2: Check and preserve accessibility attributes**
  Keep `role="tab"`, `aria-selected`, `aria-label`, `tabIndex`, and keyboard handlers. Replace any emoji with Lucide icons.
- [ ] **Step 3: Verify linting**
  Run `npm run lint`.

---

### Task 3: GameHub Component Redesign (`src/components/GameHub.tsx`)

**Files:**
- Modify: `src/components/GameHub.tsx`

**Interfaces:**
- Consumes: Nav navigation handlers (`onNavigate`).
- Produces: Editorial hero marketing page without emoji or gradient headlines.

- [ ] **Step 1: De-slop Hero section**
  Heading: Big Cinzel display text (`font-cinzel text-[#F1F5F9]`, no `bg-clip-text` gradient, no italic).
  Primary CTA: Solid gold accent (`bg-[#F59E0B] text-black font-cinzel font-bold tracking-wider hover:bg-[#D97706]`, no gradient, no glow shadow).
  Secondary CTA: Outline (`border border-[#30363d] text-white hover:border-[#F59E0B]`).
- [ ] **Step 2: Redesign Feature cards (4)**
  Background: Solid `bg-[#141a26]` (paper-2), `border border-[#30363d]`, remove `backdrop-blur` and `bg-[#0f172a]/70`.
  Icons: Plain Lucide icon in accent color (`text-[#F59E0B]`), remove rounded-2xl gradient background boxes behind icons.
  Hover: Clean border color change (`hover:border-[#F59E0B]/50`), no scale-105 transform or glow shadows.
- [ ] **Step 3: Clean up Footer and remove all emoji in copy**
  Replace emoji in UI copy with Lucide icons or clear text.
  Footer: Plain text links, preserve keyboard navigation and `aria-label`s.
- [ ] **Step 4: Verify linting**
  Run `npm run lint`.

---

### Task 4: LorcanaBoard Component Redesign (`src/components/LorcanaBoard.tsx`)

**Files:**
- Modify: `src/components/LorcanaBoard.tsx`

**Interfaces:**
- Consumes: Lorcana state, engine logic, handlers.
- Produces: Atmospheric workbench game board with solid panels and 0 emoji.

- [ ] **Step 1: Replace all glass-panel & backdrop-blur instances**
  Change all `glass-panel`, `glass-panel-heavy`, `backdrop-blur-*` containers to solid `bg-[#141a26]` or `bg-[#0B0F19]` with `border border-[#30363d]`.
- [ ] **Step 2: Refactor Inkwell Zone & Lore Tracker**
  Inkwell zone: Solid dark container, ready ink cells = `bg-[#F59E0B]/10 border border-[#F59E0B]/40 text-[#F59E0B]`, remove `animate-pulse` on ink droplets, remove `shadow-[0_0_12px...]`.
  Lore tracker: Solid panel, progress bar solid `bg-[#F59E0B]` (no `lore-glow-bar` gradient/glow), text hierarchy by size.
- [ ] **Step 3: Refactor Field Cards & Hand Dock**
  Field cards: Use `.card-foil-light` or `border border-[#30363d] hover:border-[#F59E0B]` on hover ONLY. Remove `shadow-[0_0_25px...]` colored glows and `group-hover:scale-110` on inner images.
  Hand dock: Solid background `bg-[#0d1420] border-t border-[#30363d]` (remove `backdrop-blur-2xl`), keep translateY hover lift, remove `shadow-[0_-15px_40px...]` glow.
- [ ] **Step 4: De-slop Buttons, Banners, and Action Log**
  Pass Turn / Quest / Action buttons: Solid amber `bg-[#F59E0B] text-black font-cinzel font-bold` or outline buttons, no glow shadows.
  Notice Banner & Action Log: Solid background `bg-[#0d1c2d] border border-[#1e293b]`, no drop-shadow glows.
- [ ] **Step 5: Purge ALL emoji in copy & preserve state/logic**
  Replace all emoji in UI text (💧✨⚔️🛡️♦️🚫⚠️🏆, etc.) with Lucide icons or plain text.
  Verify zero logic, state, drag, or turn engine modifications were made.
- [ ] **Step 6: Verify linting**
  Run `npm run lint`.

---

### Task 5: DeckBuilder Component Redesign (`src/components/DeckBuilder.tsx`)

**Files:**
- Modify: `src/components/DeckBuilder.tsx`

**Interfaces:**
- Consumes: Deck state, card filter handlers.
- Produces: Solid workbench deck builder page.

- [ ] **Step 1: De-slop Filter Buttons & Add CTAs**
  Primary Add button: Solid amber `bg-[#F59E0B] text-black font-cinzel font-bold hover:bg-[#D97706]`.
  Active ink filter button: Solid `bg-[#242b3d] text-[#F59E0B] border border-[#F59E0B]` (no gradient, no scale-105).
- [ ] **Step 2: Solid Card Grid & Header Panels**
  Card items: Solid `bg-[#141a26] border border-[#30363d] hover:border-[#F59E0B]`, remove `hover:scale-[1.02]` and glow shadows.
  Panels/Header: Solid surfaces, remove `backdrop-blur`.
- [ ] **Step 3: Remove emoji & preserve functionality**
  Replace emoji in copy with Lucide icons. Keep clear confirm, save banner, 4-copy disable logic, aria-labels.
- [ ] **Step 4: Verify linting**
  Run `npm run lint`.

---

### Task 6: AnalyticsDashboard Component Redesign (`src/components/AnalyticsDashboard.tsx`)

**Files:**
- Modify: `src/components/AnalyticsDashboard.tsx`

**Interfaces:**
- Consumes: Analytics data.
- Produces: Solid paper-2 dashboard with styled Chart.js graphs.

- [ ] **Step 1: De-slop KPI Cards**
  Background: Solid `bg-[#141a26] border border-[#30363d]`.
  Remove decorative blur circles (`bg-amber-500/10 rounded-full blur-xl`).
  Icons: Plain accent-colored Lucide icons (`text-[#F59E0B]`).
- [ ] **Step 2: Restyle Chart.js palette & remove emoji**
  Configure Chart.js line/bar colors to amber accent (`#F59E0B`) and slate grids (`rgba(148, 163, 184, 0.1)`).
  Remove emoji in UI text.
- [ ] **Step 3: Verify linting**
  Run `npm run lint`.

---

### Task 7: RulesGuide Component Redesign (`src/components/RulesGuide.tsx`)

**Files:**
- Modify: `src/components/RulesGuide.tsx`

**Interfaces:**
- Consumes: Rules tab state.
- Produces: Typographic editorial rules guide.

- [ ] **Step 1: De-slop Banner & Step Cards**
  Header banner: Solid panel `bg-[#141a26] border border-[#30363d]`, headline solid text (Cinzel bold, no gradient text).
  Step cards: Solid `bg-[#141a26] border border-[#30363d]`. Active step: `border-[#F59E0B] bg-[#1e2638]` (no scale-105, no glow).
- [ ] **Step 2: Navigation Buttons & Emoji Purge**
  Prev/Next buttons: Solid amber / outline buttons.
  Replace emoji in rule descriptions and headers with Lucide icons or clean text.
  Keep keyboard navigation and typed tabs intact.
- [ ] **Step 3: Verify linting**
  Run `npm run lint`.

---

### Task 8: UserDashboard & AuthModal Components (`src/components/UserDashboard.tsx`, `src/components/AuthModal.tsx`)

**Files:**
- Modify: `src/components/UserDashboard.tsx`
- Modify: `src/components/AuthModal.tsx`

**Interfaces:**
- Consumes: Auth state, user profile state.
- Produces: Solid forms and user management cards.

- [ ] **Step 1: De-slop UserDashboard**
  Cards/forms: Solid `bg-[#141a26] border border-[#30363d]`, remove `backdrop-blur` and glass panels.
  Buttons: Solid amber primary, outline secondary, no gradient fills.
  Remove emoji in UI text.
- [ ] **Step 2: De-slop AuthModal**
  Modal card: Solid `bg-[#141a26] border border-[#30363d]`, remove backdrop blur from modal box.
  Inputs: Keep `shadcn-input`. Buttons: Solid amber / outline.
  Preserve auth flow, delete confirmation modal, and aria-labels.
- [ ] **Step 3: Verify linting**
  Run `npm run lint`.

---

### Task 9: BoosterPackModal & Card3DInspectorModal Components (`src/components/BoosterPackModal.tsx`, `src/components/Card3DInspectorModal.tsx`)

**Files:**
- Modify: `src/components/BoosterPackModal.tsx`
- Modify: `src/components/Card3DInspectorModal.tsx`

**Interfaces:**
- Consumes: Pack reveal and 3D card inspect states.
- Produces: Interactive modal dialogs with solid panels and subtle rarity borders.

- [ ] **Step 1: De-slop BoosterPackModal**
  Modal container: Solid `bg-[#0d1420] border border-[#30363d]`.
  Close & action buttons: Solid/outline.
  Card items: Keep 3D flip interaction, but remove 80px colored glows (`shadow-[0_0_80px...]`), replace with thin rarity border + subtle neutral shadow.
  Remove emoji in copy.
- [ ] **Step 2: De-slop Card3DInspectorModal**
  Modal container: Solid `bg-[#0d1420] border border-[#30363d]`.
  Keep tilt/glare 3D rotation, but tone down extreme glow shadows around the card.
  Close button: Solid `#1e2638` with border.
- [ ] **Step 3: Verify linting**
  Run `npm run lint`.

---

### Task 10: ArtworkCarousel Component Redesign (`src/components/ArtworkCarousel.tsx`)

**Files:**
- Modify: `src/components/ArtworkCarousel.tsx`

**Interfaces:**
- Consumes: Artwork list, active index.
- Produces: Editorial artwork slideshow.

- [ ] **Step 1: De-slop Carousel chrome & dots**
  Chrome container: Solid background `bg-[#141a26] border border-[#30363d]`.
  Active dot: Thin gold bar/circle (`bg-[#F59E0B]`, no glow shadow).
  Nav buttons: Solid dark outline buttons.
  Fullscreen modal: Keep `Modal.tsx` from R1, solid modal background.
- [ ] **Step 2: Verify linting**
  Run `npm run lint`.

---

### Task 11: Global App Integration, Auditing & Final Verification (`src/App.tsx`, Verification Scripts)

**Files:**
- Modify: `src/App.tsx` (if needed for background wrapper classes)

**Interfaces:**
- Consumes: Main App layout.
- Produces: Fully verified, anti-slop Disney Lorcana PlayLab Cloud application.

- [ ] **Step 1: Check `src/App.tsx` and ensure solid dark container setup**
- [ ] **Step 2: Run complete linting and build validation**
  Run `npm run lint` until exit 0.
  Run `npm run build` until exit 0.
- [ ] **Step 3: Run metrics check script**
  Run node metrics script to verify slop reduction:
  - 0 emoji in UI copy
  - 0 backdrop-blur panels on surfaces
  - 0 shimmer classes
  - 0 glow shadows (`shadow-[0_0_...]`) except foil-light on card hover
  - radius <= 12px on surfaces
  - aria-labels preserved (>= 24)
  - prefers-reduced-motion block intact
- [ ] **Step 4: Report before/after summary**
