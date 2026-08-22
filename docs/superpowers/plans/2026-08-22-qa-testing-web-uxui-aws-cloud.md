# 🧪 QA Testing Implementation Plan: Web UX/UI & AWS Cloud

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish an enterprise-grade, comprehensive QA Testing Suite and execute full UX/UI and AWS Serverless Cloud verification (Vitest + Playwright + Dual-mode live/mock AWS testing) for the Disney Lorcana PlayLab Cloud system.

**Architecture:** 
- **Unit & Integration Layer:** Vitest + JSDOM for testing Zustand global stores, Lorcana rules/deck validation engine, AWS API Gateway clients, WebSocket state machines, and Lambda backend handlers.
- **E2E & UX/UI Layer:** Playwright for multi-viewport responsive UI audits, Drag-and-Drop board game mechanics, 3D card inspect modals, and multi-browser context real-time 2-player WebSocket match synchronization (<100ms).
- **Cloud QA Layer:** Dual-mode testing verifying live AWS endpoints (`LorcanaPlayLabApi` and `LorcanaPlayLabWebSocketApi` on `us-east-1` with DynamoDB Pay-Per-Request Free Tier) alongside robust mock fallback for CI/offline runs.

**Tech Stack:** Vitest, Playwright, @testing-library/react, React 19, TypeScript 5, Vite 6, Tailwind CSS v4, Zustand 5, AWS SDK v3, WebSocket.

---

## Global Constraints

- 100% AWS Serverless Free Tier ($0.00 budget): No provisioned EC2/RDS or NAT gateways.
- Low-latency real-time sync requirement: WebSocket message round-trip time < 100ms.
- Strict Lorcana deck rule validation: 60+ cards, maximum 2 ink colors, max 4 copies per card.
- Visual & Aesthetic excellence: Dark luxury Lorcana theme, WebGL Shader fallback handling, responsive design (Desktop, Laptop, Tablet, Mobile).
- Zero breaking changes to existing production code; all tests must be self-contained and repeatable.

---

## Task 1: QA Test Strategy & Matrix Documentation

**Files:**
- Create: `docs/QA_TEST_PLAN.md`

**Interfaces:**
- Consumes: `PLAN_PROJECT.md`, `CASE_STUDY.md`, `template.yaml`, `src/types/lorcana.ts`
- Produces: Complete QA Test Plan & Scenario Matrix (UX/UI, Functional, Performance, Security, AWS Cloud)

- [ ] **Step 1: Write `docs/QA_TEST_PLAN.md`**

```markdown
# 🧪 Disney Lorcana PlayLab Cloud — QA Master Test Plan & Verification Matrix

## 1. Overview & Objectives
This document defines the Quality Assurance strategy for Disney Lorcana PlayLab Cloud, covering:
- **UX/UI & Usability:** Game board interactive mechanics, 408-card deck builder, WebGL shader performance, responsive layouts.
- **AWS Serverless Cloud:** Custom bcrypt/JWT Auth, DynamoDB CRUD (Users/Decks/Rooms), API Gateway WebSocket 2-player sync (<100ms), SQS Analyzer, Free Tier compliance ($0.00).

## 2. Test Execution Matrix
| ID | Area | Scenario | Type | Target Environment |
|---|---|---|---|---|
| TC-UI-01 | UI/UX | WebGL Gold Ink Shader rendering & canvas fallback | E2E | Chrome/Safari/Firefox |
| TC-UI-02 | UI/UX | Deck Builder 408-card search, ink filters & rule validation | E2E / Unit | Web Client |
| TC-UI-03 | Gameplay | Lorcana Board Drag & Drop, Ready/Exert, Inkwell, Lore tracker | E2E | Web Client |
| TC-UI-04 | Responsive | Layout verification on Desktop (1920x1080), Tablet, Mobile | E2E | Multi-viewport |
| TC-SYNC-01 | WebSockets | Real-time 2-Player card play & Lore sync (<100ms) | E2E Multi-context | AWS WebSocket / Mock |
| TC-SYNC-02 | WebSockets | Auto-reconnect & state recovery within 30s | Integration / E2E | AWS WebSocket / Mock |
| TC-CLOUD-01 | Cloud Auth | Custom bcrypt password hashing & JWT token generation | Unit / Live API | AWS Lambda / DynamoDB |
| TC-CLOUD-02 | Cloud Decks | Save, list, and delete decks in DynamoDB | Unit / Live API | AWS Lambda / DynamoDB |
| TC-CLOUD-03 | Cloud SQS | Asynchronous deck synergy analysis queue processing | Integration | AWS SQS / Analyzer |
```

- [ ] **Step 2: Verify file creation and markdown syntax**

Run: `Test-Path docs/QA_TEST_PLAN.md`
Expected: `True`

---

## Task 2: Testing Infrastructure Setup (Vitest + Playwright + Dual-Mode Config)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/tests/setup.ts`
- Create: `src/tests/mocks/awsMocks.ts`

**Interfaces:**
- Consumes: Node.js, Vite 6, React 19
- Produces: Test runner commands `npm run test:unit`, `npm run test:e2e`, `npm run test:cloud`

- [ ] **Step 1: Install testing dependencies**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @playwright/test cross-env
```

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}', 'backend/__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: Create `playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'Tablet iPad',
      use: { ...devices['iPad Pro 11'] },
    },
    {
      name: 'Mobile Phone',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
```

- [ ] **Step 4: Create `src/tests/setup.ts` & `src/tests/mocks/awsMocks.ts`**

Create test polyfills for `window.matchMedia`, `HTMLCanvasElement.getContext('webgl2')`, and Mock WebSocket class.

- [ ] **Step 5: Add npm scripts in `package.json`**

Update `package.json` scripts:
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "tsc --noEmit",
  "preview": "vite preview",
  "test": "vitest run",
  "test:unit": "vitest run src/__tests__",
  "test:backend": "vitest run backend/__tests__",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:all": "vitest run && playwright test"
}
```

- [ ] **Step 6: Run quick smoke test to verify Vitest configuration**

Run: `npm test`
Expected: Pass without errors.

---

## Task 3: Unit & Integration Test Suite — State Stores, Rules, & Cloud Lambdas

**Files:**
- Create: `src/__tests__/store.test.ts`
- Create: `src/__tests__/cardRules.test.ts`
- Create: `src/__tests__/services.test.ts`
- Create: `backend/__tests__/lambdas.test.ts`

**Interfaces:**
- Consumes: `src/store/*`, `src/data/cardPool.ts`, `src/services/api.ts`, `backend/*`
- Produces: 100% verified test passes for all core logic, deck constraints, API payloads, and Lambda handlers.

- [ ] **Step 1: Write `src/__tests__/store.test.ts`**
Test `useAuthStore` (login/logout/token persistence), `useDeckStore` (deck creation/card addition/deck validation), `useLanguageStore` (th/en toggle), and `usePlaymatStore`.

- [ ] **Step 2: Write `src/__tests__/cardRules.test.ts`**
Test 408-card dataset mapping, deck legality rules (min 60 cards, maximum 2 colors, max 4 copies of same card name/title), inkable vs uninkable verification, and cost curve histogram computation.

- [ ] **Step 3: Write `src/__tests__/services.test.ts`**
Test `apiService` methods (register, login, saveDeck, getUserDecks, deleteDeck, analyzeDeck) and `webSocketService` (connection status transitions, queue flushing on connect, action payload dispatch, auto-reconnect logic).

- [ ] **Step 4: Write `backend/__tests__/lambdas.test.ts`**
Test AWS Lambda logic:
- `auth/register.ts`: bcrypt hash rounds, duplicate username check, JWT token creation.
- `auth/login.ts`: bcrypt compare, invalid password rejection, JWT signing.
- `deck/handler.ts`: CRUD payload validation and DynamoDB Marshalling.
- `room/handler.ts`: WebSocket connection routing, player1/player2 seat assignment, broadcast message propagation.

- [ ] **Step 5: Execute Vitest test suite**

Run: `npm run test:unit && npm run test:backend`
Expected: All unit & integration tests PASS.

---

## Task 4: Playwright E2E Test Suite — UX/UI Board Mechanics & Deck Builder

**Files:**
- Create: `e2e/01-hub-navigation.spec.ts`
- Create: `e2e/02-deckbuilder.spec.ts`
- Create: `e2e/03-board-mechanics.spec.ts`
- Create: `e2e/04-responsive-ux.spec.ts`

**Interfaces:**
- Consumes: Playwright Browser Runner, Running Vite dev server at `http://localhost:5173`
- Produces: Automated browser screenshots and interaction verification reports.

- [ ] **Step 1: Write `e2e/01-hub-navigation.spec.ts`**
Tests landing on Game Hub, WebGL Shader canvas initialization, Tab navigation (Hub -> Lobby -> Board -> Deck Builder -> Analytics -> Rules -> Dashboard), and Patch Notes Modal opening/closing.

- [ ] **Step 2: Write `e2e/02-deckbuilder.spec.ts`**
Tests searching cards (e.g. "Elsa", "Mickey"), filtering by Ink color (Amber, Sapphire, etc.), adding cards to custom deck, validating deck limits counter, exporting deck JSON, and viewing Cost Curve chart.

- [ ] **Step 3: Write `e2e/03-board-mechanics.spec.ts`**
Tests single-player / sandbox board:
- Drawing cards into Hand
- Playing cards to Field zone
- Exerting / Readying cards (rotating 90 degrees)
- Moving card to Inkwell and toggling ink count
- Modifying Lore Counter (+/- up to 20 Lore to trigger Victory modal)
- Opening Card 3D Inspector Modal and Dice Duel Modal

- [ ] **Step 4: Write `e2e/04-responsive-ux.spec.ts`**
Tests visual presentation, font scaling, navigation responsiveness, and modal fitting across Desktop (1440x900), Tablet iPad, and Mobile iPhone viewports.

- [ ] **Step 5: Run Playwright single-player & UI tests**

Run: `npx playwright test e2e/01-hub-navigation.spec.ts e2e/02-deckbuilder.spec.ts e2e/03-board-mechanics.spec.ts e2e/04-responsive-ux.spec.ts`
Expected: All test scenarios PASS with visual checks.

---

## Task 5: Playwright E2E Multi-Client Suite — Real-time 2-Player Match Sync & Reconnect

**Files:**
- Create: `e2e/05-match-realtime-sync.spec.ts`

**Interfaces:**
- Consumes: Dual Playwright browser contexts (`browser.newContext()` for Player 1 and Player 2)
- Produces: Real-time latency verification (<100ms) and multi-user synchronization evidence.

- [ ] **Step 1: Write `e2e/05-match-realtime-sync.spec.ts`**
Implements dual-browser automation:
1. Context A (Player 1 "Illumineer Alpha") enters Match Lobby, creates Room "QA-ROOM-777", selects Ruby/Amethyst Starter Deck.
2. Context B (Player 2 "Illumineer Beta") enters Match Lobby, joins Room "QA-ROOM-777", selects Amber/Steel Starter Deck.
3. Both players enter LorcanaBoard in synchronized Match Mode.
4. Player 1 plays card to Field -> Player 2 opponent field renders the card in real-time.
5. Player 1 increments Lore from 0 to 5 -> Player 2 view updates Player 1's Lore counter to 5.
6. Player 1 toggles Turn -> Player 2 receives turn notification.
7. Player 2 simulates disconnect and reloads -> Session recovers and board state restores seamlessly.

- [ ] **Step 2: Run Multi-Client E2E test suite**

Run: `npx playwright test e2e/05-match-realtime-sync.spec.ts`
Expected: Dual-context WebSocket match sync passes successfully.

---

## Task 6: Live Cloud QA Testing & Comprehensive Report Generation

**Files:**
- Create: `scripts/test-live-cloud.ts`
- Create: `docs/QA_TEST_REPORT.md`

**Interfaces:**
- Consumes: Live AWS API Gateway (`https://iorxmxsoll.execute-api.us-east-1.amazonaws.com/prod`) & WebSocket (`wss://a86238wqo4.execute-api.us-east-1.amazonaws.com/prod`)
- Produces: `docs/QA_TEST_REPORT.md` with benchmark tables, latency percentiles, defect fixes, and certification of 100% Free Tier compliance.

- [ ] **Step 1: Write `scripts/test-live-cloud.ts`**
A standalone live AWS Cloud validation script testing:
- Live user registration (`qa_user_<timestamp>`)
- Live user authentication & JWT verification
- Live deck creation, retrieval, and deletion in DynamoDB
- Live WebSocket handshake, ping/pong latency measurement, and message echo timing

- [ ] **Step 2: Execute Live Cloud verification**

Run: `npx tsx scripts/test-live-cloud.ts`
Expected: Live AWS endpoints return 200 OK, latency < 100ms, data correctly saved/queried from DynamoDB.

- [ ] **Step 3: Compile `docs/QA_TEST_REPORT.md`**
Synthesize all test outputs into a complete QA report with:
- Executive Summary
- Test Case Pass/Fail Summary (100% Target)
- Latency & Performance Benchmarks (WebSocket RTT, API response times, WebGL FPS)
- UX/UI Evaluation & Defect Resolution Log
- AWS Cloud Architecture & Free Tier Audit

---

## Verification Plan

### Automated Tests
- `npm run test:unit`: All Unit tests for stores, rules, and services pass.
- `npm run test:backend`: All AWS Lambda handler unit tests pass.
- `npm run test:e2e`: All Playwright E2E suites pass across Desktop, Tablet, and Mobile.
- `npx tsx scripts/test-live-cloud.ts`: Live AWS Cloud verification passes.

### Manual & Visual Verification
- Verify WebGL shader fluid animation and zero console errors.
- Verify smooth card drag-and-drop animations with Framer Motion.
- Verify 2-player real-time match state synchronization on live browser tabs.
