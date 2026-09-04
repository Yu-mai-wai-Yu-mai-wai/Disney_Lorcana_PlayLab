# Disney Lorcana PlayLab Cloud - UX/UI Accessibility Polish Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute a comprehensive UX/UI accessibility polish pass for Disney Lorcana PlayLab Cloud preserving all visual theme styling, game logic, and data.

**Architecture:** Create a reusable accessible `Modal` component with focus trapping, body scroll lock, backdrop click, keyboard listeners (`Escape`), and `aria-*` attributes. Refactor existing modals to use `Modal`. Add missing `aria-label`, `role="button"`, `tabIndex={0}`, and `onKeyDown` handlers across interactive elements. Add visible image error fallbacks and proper `alt` attributes. Implement 2-step destructive confirmation flows and CSS media query updates for reduced motion and focus visibility.

**Tech Stack:** React 19, Vite 6, TypeScript (strict), Tailwind v4, Framer Motion, Zustand.

## Global Constraints

- Do NOT redesign visual styling or change existing `className` values.
- Do NOT touch `backend/`, `src/services/websocket.ts`, `src/services/api.ts`, `src/store/`, or `src/types/`.
- No new npm packages.
- Strict TypeScript compliance (no `any` except existing `handleDragEnd` info param).

---

### Task 1: Create Reusable Modal Component (`src/components/ui/Modal.tsx`)

**Files:**
- Create: `src/components/ui/Modal.tsx`

**Deliverables:**
- Accessible modal container with `role="dialog"`, `aria-modal="true"`, optional `aria-label` / `ariaLabel`.
- Keyboard support (`Escape` closes modal).
- Body scroll locking (`document.body.style.overflow = 'hidden'`, restoring original `overflow` on cleanup).
- Focus trap (cycling focus within focusable children on `Tab` / `Shift+Tab`).
- Backdrop overlay click to close.
- Framer Motion `AnimatePresence` animation (initial scale ~0.88 opacity 0).

---

### Task 2: Refactor Modals to Use `Modal` Wrapper

**Files:**
- Modify: `src/components/AuthModal.tsx`
- Modify: `src/components/Card3DInspectorModal.tsx`
- Modify: `src/components/BoosterPackModal.tsx`
- Modify: `src/components/LorcanaBoard.tsx`
- Modify: `src/components/ArtworkCarousel.tsx`

**Deliverables:**
- `AuthModal.tsx`: Swap outer backdrop + `<AnimatePresence>` for `<Modal>`, add `aria-label="ปิด"` on X close button.
- `Card3DInspectorModal.tsx`: Use `<Modal>` with `ariaLabel="Card Inspector"`, keep `card === null` check, add close button `aria-label`.
- `BoosterPackModal.tsx`: Use `<Modal>` with `ariaLabel="Booster Pack"`, add close button `aria-label`.
- `LorcanaBoard.tsx`: Wrap Card Action Modal with `<Modal>` using `ariaLabel="Card Action"`.
- `ArtworkCarousel.tsx`: Wrap Fullscreen Artwork Preview with `<Modal>` using `ariaLabel="Artwork Preview"`.

---

### Task 3 & 4: Accessibility Attributes (`aria-label`, `role="button"`, `tabIndex`, `onKeyDown`)

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/GameHub.tsx`
- Modify: `src/components/LorcanaBoard.tsx`
- Modify: `src/components/ArtworkCarousel.tsx`
- Modify: `src/components/DeckBuilder.tsx`
- Modify: `src/components/UserDashboard.tsx`
- Modify: `src/components/BoosterPackModal.tsx`

**Deliverables:**
- Add `aria-label` to all icon-only buttons (Close 'ปิด'/'Close', Board Quest, Carousel prev/next & autoplay, Navbar logout, DeckBuilder +/- buttons, UserDashboard delete button).
- Add `role="button"`, `tabIndex={0}`, and `onKeyDown` (`Enter` / `Space`) to real interactive `div`s (GameHub feature cards & footer links, Navbar logo & user profile, Board field cards & draw pile, Artwork tiles, Booster Pack card flip div & slice text).

---

### Task 5: Image Alt Attributes and Error Fallback

**Files:**
- Modify: `src/components/Card3DInspectorModal.tsx`
- Modify: `src/components/BoosterPackModal.tsx`
- Modify: `src/components/DeckBuilder.tsx`
- Modify: `src/components/LorcanaBoard.tsx`
- Modify: `src/components/ArtworkCarousel.tsx`
- Modify: `src/components/GameHub.tsx`
- Modify: `src/components/RulesGuide.tsx`

**Deliverables:**
- Descriptive `alt` attributes for all `<img>` elements using card/artwork names instead of generic strings.
- Wrap images in relative container with placeholder `div` behind it ("Image unavailable" + card name). Set `img.style.display = 'none'` on `onError`.

---

### Task 6: Destructive Confirmations and Inline Alerts

**Files:**
- Modify: `src/components/UserDashboard.tsx`
- Modify: `src/components/DeckBuilder.tsx`

**Deliverables:**
- `UserDashboard.tsx`: Add 2-step delete confirm state to `handleDeleteDeck` with 3-second auto-reset.
- `DeckBuilder.tsx`: Add 2-step confirm state to `clearDeck`. Ensure inline success/status banner is shown without `alert()`.

---

### Task 7: CSS Fixes & Reduced Motion (`src/index.css`)

**Files:**
- Modify: `src/index.css`

**Deliverables:**
- Add `@media (prefers-reduced-motion: reduce)` block to force fast transitions and disable infinite animations.
- Add global `:focus-visible` styling (`outline: 2px solid #F59E0B; outline-offset: 2px;`).
- Fix `.shadcn-badge` invalid `items-center: center` property to `align-items: center`.

---

### Task 8: BoosterPackModal Keyboard/Mobile Alternative

**Files:**
- Modify: `src/components/BoosterPackModal.tsx`

**Deliverables:**
- Add a visible button "Open Pack (เปิดซอง)" underneath the 3D pack during sealed state so non-pointer/keyboard users can open the pack.

---

### Task 9: Navbar Mobile Responsiveness & Navigation Labels

**Files:**
- Modify: `src/components/Navbar.tsx`

**Deliverables:**
- Hide text labels on small screens (`hidden sm:inline`), keeping icons visible.
- Add `flex-wrap` and gap adjustments to prevent overflow at 375px screen width.
- Add descriptive `aria-label` to each nav button.

---

### Task 10: RulesGuide Keyboard Navigation & Type Safety

**Files:**
- Modify: `src/components/RulesGuide.tsx`

**Deliverables:**
- Add `useEffect` keydown listener for `ArrowLeft` / `ArrowRight` to cycle between guide tabs.
- Fix `'tab.id as any'` with proper `TabId` union typing.
