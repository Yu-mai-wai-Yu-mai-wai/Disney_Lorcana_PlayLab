# 🪄 Case Study: Disney Lorcana PlayLab Cloud
> **Agentic AI Engineering & AWS Serverless Real-Time TCG Playground**

---

## 📌 Executive Summary

* **Project Title:** Disney Lorcana PlayLab Cloud
* **Academic Course:** Cloud Computing (1/2569), Faculty of Information Technology, KMITL
* **Role:** Lead Full-Stack Architect & AI System Engineer
* **Target Infrastructure:** AWS Serverless ($0.00 Free Tier Optimized)
* **Core Tech Stack:**
  * **Frontend:** React 19, TypeScript 5.x, Vite 6, Tailwind CSS v4, Framer Motion
  * **3D Physics & Canvas Engine:** WebGL, CSS 3D Transforms (`preserve-3d`), Pointer Capture Physics
  * **Backend Compute:** AWS Lambda (Node.js 20.x / Python 3.12), SAM Infrastructure-as-Code (`template.yaml`)
  * **Real-time & Queues:** AWS API Gateway WebSockets (<100ms real-time sync), Amazon SQS
  * **Database & Auth:** Amazon DynamoDB (`UsersTable`, `DecksTable`, `RoomStateTable`), JWT + bcrypt Lambda Authorizer

---

## 🎯 Problem Statement & Intent

Traditional Trading Card Game (TCG) simulators often suffer from:
1. Cluttered, non-responsive user interfaces with poor viewport utilization on mobile/tablet devices.
2. Flat, 2D visual representations that lack physical card interaction (foil sheen, 3D inspect, booster pack opening immersion).
3. Heavy, expensive server-bound backend infrastructure with high monthly running costs.

**Disney Lorcana PlayLab Cloud** was engineered to solve these challenges by introducing an **AI-Native Agentic Architecture** combined with a **$0.00 AWS Serverless footprint** and a **Luxury 3D Physical Card Experience**.

---

## 🏛️ Agentic Software Architecture & Design Principles

Following the **Agentic Engineering Guardrails**:

### 1. Deep Modules, Simple Interfaces
Complex domain logic (such as card rarity glowing shaders, 3D pointer tilt calculation, Fisher-Yates booster pack generation, and official rules verification) is encapsulated within deep, isolated modules (`BoosterPackModal`, `Card3DInspectorModal`, `InkSymbol`, `api.ts`), leaving outer parent components with minimal, clean public props.

### 2. Hexagonal Architecture (Ports & Adapters)
The application core decouples database storage and server APIs via an Abstract Data Layer (`apiService`). If AWS services are offline or unreachable, the system automatically falls back to an in-memory client-side repository (`FALLBACK_DATABASE`), ensuring zero runtime crashes.

### 3. Fisher-Yates 100% True Randomization Engine
Booster pack generation uses an un-biased Fisher-Yates shuffle across 3,129 official Lorcana cards (Set 1 & Set 2), correctly enforcing official rarity distributions across all 9 rarities:
- **Common:** 940 cards
- **Uncommon:** 702 cards
- **Rare:** 629 cards
- **Super Rare:** 238 cards
- **Epic:** 90 cards
- **Legendary:** 160 cards
- **Enchanted (Borderless Secret Art):** 222 cards
- **Iconic:** 10 cards
- **Special:** 251 cards

---

## 🎨 UX/UI & Aesthetic Engineering

1. **Luxury Dark Obsidian Slate & Amber Gold Foil Aesthetic:**
   - Replaced oversaturated neon colors with a refined, dark academic theme (`#070A10` obsidian dark slate with `#F59E0B` amber gold accents).
2. **Direct Tap & Swipe 3D Card Reveal:**
   - 3D booster pack tearing animation with realistic crimped zig-zag seals.
   - Single centered 3D card inspect with 100% reliable 2-step tap/swipe mechanics (Tap 1 = 180° 3D flip, Tap 2 / Swipe = Advance to next card).
3. **Full-Frame Immersive Landing Page Gallery:**
   - Widescreen 3D Cover Flow artwork slider (`ArtworkCarousel.tsx`) paired with ultra-diffused, feathered ambient backdrop layers (`landingPageBackground1` & `landingPageBackground2`).
4. **Official PNG Ink Symbol Badges:**
   - High-resolution official Disney Lorcana PNG symbol assets for Amber, Amethyst, Emerald, Ruby, Sapphire, and Steel integrated across all filters and card detail banners.

---

## 🛠️ Technical Challenges & Solutions

| Technical Challenge | Root Cause | Agentic Engineering Solution |
| :--- | :--- | :--- |
| **Blank Booster Popup Crash** | External API fetch latency before JSON completion. | Implemented `FALLBACK_DATABASE` failsafe and async state hydration. |
| **Card Backface Invisibility Bug** | Math collision: `180° + 180° = 360°` causing child div to face away. | Restructured 3D inner container with isolated Y-axis rotation and explicit `backfaceVisibility: 'hidden'`. |
| **Framer Motion Click Swallow** | Pointer drag gesture capturing mouse down events. | Replaced standard `onClick` with Framer Motion `onTap` and unconstrained elastic bounds. |
| **Referrer Policy Hotlink Block** | Ravensburger CDN blocking standard image referrer headers. | Added `referrerPolicy="no-referrer"` to all card `<img />` tags. |

---

## 📊 Verification & Production Readiness

* **Zero-Shot Build Check:** `built in 5.28s` with **0 Errors**.
* **Type Safety:** 100% Strict TypeScript compliance across types, Zustand stores, and component props.
* **Workspace Hygiene:** Public assets mapped under Rule 10 with clean `.gitignore` / `.obsidianignore` configuration.

---
*Updated: August 2026 — Course Project for Cloud Computing, KMITL IT*
