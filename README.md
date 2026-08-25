# 🪄 Disney Lorcana PlayLab Cloud

> **100% AWS Serverless Real-time Playground, 3D Booster Pack Simulator & Asynchronous Deck Analyzer**
> *Educational Course Project — Cloud Technology (1/2569), KMITL, Faculty of Information Technology*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless-ff9900.svg)](https://aws.amazon.com/serverless/)
[![Version](https://img.shields.io/badge/version-v1.5.0-orange.svg)](#-changelog)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**Current version: v1.5.0** (2026-08-25) — see [Changelog](#-changelog)

---

## ⚖️ Legal & Educational Disclaimer (อ่านก่อนใช้งาน)

> **This is a NON-COMMERCIAL EDUCATIONAL PROJECT. It is NOT affiliated with, endorsed by, or sponsored by Disney or Ravensburger.**
>
> - "Disney Lorcana" and all related card game assets, artwork, names, and trademarks are the property of **© Disney / Ravensburger**.
> - This project was built **solely as a university coursework** to demonstrate cloud computing architecture skills (AWS Serverless, WebSockets, NoSQL design, CI/CD) — **not to replace, compete with, or profit from the official game**.
> - Card data/images are used in limited, transformative fashion for **educational simulation and research purposes only** (comparable to a study prototype). All rights remain with their respective owners.
> - If you are a rights holder and object to any asset's inclusion, contact us and we will remove it promptly.
> - The source code of this project (our own engineering work: frontend, backend Lambdas, infrastructure scripts) is released under the MIT License — **card game assets are explicitly NOT covered by this license**.
>
> **โครงการนี้เป็นผลงานวิชาการเพื่อการศึกษาเท่านั้น ไม่มีเจตนาเชิงพาณิชย์ ไม่ได้สังกัดหรือได้รับอนุญาตจาก Disney หรือ Ravensburger — สัญลักษณ์และทรัพย์สินทางปัญญาทั้งหมดเป็นของเจ้าของแต่โดยธรรม**

---

## 📌 Project Overview

Disney Lorcana PlayLab Cloud is a high-performance web application engineered for Disney Lorcana TCG players to test single-player deck sandbox interactions, open 3D physical booster packs, inspect official cards in 3D holographic foil, simulate real-time 2-player match coordinates via AWS WebSockets (with room codes & ranked matchmaking), and analyze deck ink curves asynchronously — all running on a **$0.00 AWS Free Tier** serverless infrastructure within AWS Academy Learner Lab constraints.

---

## ✨ Key Features

1. **3D Physical Booster Pack Simulator (`BoosterPackModal.tsx`)**
   - Realistic 3D foil pack with glossy sheen & 360° rotation, draggable scissors slice animation
   - 12-card eruption with Fisher-Yates true randomization across rarities
2. **3D Interactive Holographic Card Inspector (`Card3DInspectorModal.tsx`)**
   - Real-time mouse tilt physics, glare reflections, rarity-specific foil auras
3. **Real-Time Online Match (`LorcanaBoard.tsx` + WebSocket Lambda)**
   - Private rooms with 6-digit codes + auto matchmaking queue
   - Live sync: card moves, ink, lore, turn state (~50–80ms round-trip)
   - **v1.5.0:** Exit Match vs network-drop distinction (LEAVE_ROOM hard-delete vs 60s Rejoin grace period), opponent-left notifications, auto-purge stale sessions
4. **Deck Builder & Analytics**
   - Search/filter across official dataset (Set 1–2, 3,242 cards), ink-curve analyzer via SQS async pipeline
5. **Official Rule Engine & Sandbox Playmat**
   - Single-ink-per-turn validation, dry/wet turn cycles, lore counter, rulebook guide

---

## ☁️ Architecture (AWS Serverless — 4 Layers)

```
React 19 SPA (S3 Website Hosting)
        │ HTTPS / WSS
┌───────▼─────────────────────────────────────────┐
│  API Gateway                                    │
│  • HTTP API  (iorxmxsoll) — auth/decks REST     │
│  • WebSocket (a86238wqo4) — real-time play      │
│    Throttling: Burst 100 / Rate 50 req-s        │
└───────┬─────────────────────────────────────────┘
        │
┌───────▼─────────────────────────────────────────┐
│  AWS Lambda (Node.js 20.x, LabRole)             │
│  lorcana-auth-login/register · lorcana-deck     │
│  lorcana-room (WS) · lorcana-analyzer           │
└───────┬──────────────────┬──────────────────────┘
        │                  │
┌───────▼───────┐   ┌──────▼──────┐   ┌───────────┐
│ DynamoDB      │   │ Amazon SQS  │   │ CloudWatch│
│ Users/Decks/  │   │ deck-       │   │ alarms $5 │
│ RoomState/MM  │   │ analyzer    │   │ & $20     │
│ (TTL 2h)      │   └─────────────┘   └───────────┘
└───────────────┘
```

**Security:** bcrypt (10 rounds) password hashing · signed JWT tokens · TLS enforced · least-privilege `LabRole` · API throttling · TTL-based session cleanup.

---

## ⚡ Tech Stack

* **Frontend:** TypeScript 5.x, React 19+, Vite 6, Tailwind CSS v4, Framer Motion, Zustand
* **Backend:** AWS Lambda (Node.js 20.x), API Gateway HTTP + WebSocket APIs
* **Data:** Amazon DynamoDB (on-demand, TTL enabled), Amazon S3
* **Async:** Amazon SQS + event-source-mapped analyzer Lambda
* **Auth:** Custom serverless auth (bcrypt + JWT)
* **QA:** Playwright E2E + custom real-time test dashboard (`qa/`) — 49/50 pass rate

---

## 🗂️ Project Directory Structure

```
DISNEY_LORCANA_PLAYLAB_CLOUD/
├── 📄 README.md               # This file
├── 📄 LICENSE                 # MIT License (source code only — game assets excluded)
├── 📄 CASE_STUDY.md           # Case study, architecture decisions & lessons learned
├── 📄 PLAN_PROJECT.md         # Master execution plan & stage deadlines
├── 📄 TEAM_WORKFLOW.md        # Team roles (6 members) & git workflow
├── 📁 qa/                     # Full QA campaign: master sheet, dashboard, runners
│   ├── master-sheet.json      #   50 test cases (single source of truth)
│   ├── dashboard-server.cjs   #   Real-time QA log dashboard (:9200)
│   ├── qa-reporter.cjs        #   Custom Playwright reporter → live sheet
│   └── backend-aws-runner.cjs #   35 Backend/AWS checks (Lambda invoke จริง)
├── 📁 e2e/                    # Playwright E2E suites (@TC-XX-NNN tagged)
├── 📁 src/                    # React SPA frontend
├── 📁 backend/                # AWS Lambda functions + deploy scripts
├── 📁 public/dataset/         # Official card dataset (lorcana_set1_set2.json)
├── 📁 docs/                   # Reports (PDF/DOCX/LaTeX), architecture docs, QA plan
└── 📁 scripts/                # Deployment & doc-generation utilities
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/Yu-mai-wai-Yu-mai-wai/disney-lorcana-playlab-cloud.git
cd disney-lorcana-playlab-cloud
npm install
npm run dev          # dev server at :3000
npm run build        # production build → dist/
```

### Deploy Backend (AWS Learner Lab)

```bash
cd backend
npx tsc --outDir dist_bundle
# zip each function (handler.js + node_modules) and:
aws lambda update-function-code --function-name <fn> --zip-file fileb://<fn>.zip --region us-east-1
```

See `scripts/deploy_manual.sh` and `scripts/deploy_ws.sh` for full infrastructure setup (API Gateway routes, DynamoDB tables + TTL, SQS mapping).

### Run Full QA Campaign

```bash
node qa/dashboard-server.cjs                        # QA sheet dashboard → :9200
npx playwright test e2e/qa-campaign-uxui.spec.ts    # UX/UI suite (live updates)
node qa/backend-aws-runner.cjs                      # 35 Backend+AWS checks
```

Full details: [`docs/QA_TEST_PLAN.md`](docs/QA_TEST_PLAN.md)

---

## 📝 Changelog

### v1.5.0 (2026-08-25) — Exit Match System Overhaul & Security Hardening
- 🚪 **Exit Match button**: voluntary exit sends `LEAVE_ROOM` → hard-deletes record instantly; opponent gets "left the match" notification (no more waiting for rejoin)
- ⏱️ **Grace period split**: network drop = 60s rejoin window vs Exit = immediate slot release
- 🔐 **OWASP A01 fix**: Deck API rejects invalid/tampered tokens with 401 (was falling back to anonymous access)
- ⚙️ API Gateway throttling (100 burst / 50 rate), DynamoDB TTL cleanup on every write, S3 website hosting
- 🧪 Full QA Campaign: 49/50 automated tests passed (UX/UI + Backend + AWS Cloud)

### v1.4.0 (2026-08-20) — Match Rejoin, Undo Voting & UI Overhaul
- Match rejoin with grace period, undo voting system, meta decks library, WebGL shader background, modern glassmorphism UI

*(older versions: see in-app Patch Notes modal)*

---

## 👥 Team (Group G21 — KMITL IT)

| Name | Student ID |
|---|---|
| นายชยุต บุญวัฒน์ | 67070032 |
| นายธนัทภัทร พรหมทอง | 67070069 |
| นายภูริ ประชาสุขสิน | 67070137 |
| นางสาววรรณณิศา อมรวงศ์ไพบูลย์ | 67070155 |
| นายอสิธารา พุ่มดอกไม้ | 67070199 |
| นายวรธิษณ์ คงทอง | 67070275 |

**Course instructors:** ดร. ธนานพ ทองถาวร · ผศ.ดร. พัฒนพงษ์ ฉันทมิตรโอภาส · ผศ.ดร. ลภัส ประดิษฐ์ทัศนีย์

---

## 📄 License

This project's **source code** is licensed under the [MIT License](LICENSE).

**Trademark & asset notice:** Disney Lorcana card artwork, card data, names, and related intellectual property are **NOT licensed** under this repository's code license. They belong to © Disney / Ravensburger and are referenced here solely for non-commercial educational demonstration as part of university coursework. This repository must not be used commercially or distributed as a playable product.
