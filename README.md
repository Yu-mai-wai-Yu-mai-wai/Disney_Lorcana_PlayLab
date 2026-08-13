# 🪄 Disney Lorcana PlayLab Cloud

> **100% AWS Serverless Real-time Playground, 3D Booster Pack Simulator & Asynchronous Deck Analyzer**  
> *Course Project for Cloud Technology (1/2569), KMITL IT*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![AWS Serverless](https://img.shields.io/badge/AWS-Serverless-ff9900.svg)](https://aws.amazon.com/serverless/)

---

## 📌 Project Overview

Disney Lorcana PlayLab Cloud is a high-performance web application engineered for Disney Lorcana TCG players to test single-player deck sandbox interactions, open 3D physical booster packs, inspect 3,129 official cards across all 9 rarities in 3D holographic foil, simulate real-time 2-player match coordinates via AWS WebSockets, and analyze deck ink curves asynchronously—all running on a **$0.00 AWS Free Tier** serverless infrastructure.

---

## ✨ Key Features

1. **3D Physical Booster Pack Simulator (`BoosterPackModal.tsx`):**
   - Realistic 3D foil pack with glossy plastic sheen & 360° mouse rotation.
   - Draggable scissors ✂️ for dashed line slice tearing animation.
   - 12-card eruption with 100% Fisher-Yates true randomization across all 9 rarities.
   - Direct Tap & Swipe 3D Card Reveal (Tap 1 = 180° flip, Tap 2 / Swipe = Next card).

2. **3D Interactive Holographic Card Inspector (`Card3DInspectorModal.tsx`):**
   - Real-time mouse tilt physics and light glare reflections.
   - Custom luxury foil auras for all rarities (Common, Uncommon, Rare, Super Rare, Epic, Legendary, Enchanted, Iconic, Special).

3. **Official Disney Lorcana PNG Symbol System (`InkSymbol.tsx`):**
   - High-definition official PNG symbol assets for Amber 🟡, Amethyst 🟣, Emerald 🟢, Ruby 🔴, Sapphire 🔵, and Steel ⚪ integrated across filters and card detail banners.

4. **Full-Frame 3D Landing Page Showcase & Dynamic Ambient Background (`GameHub.tsx`):**
   - Widescreen 3D Cover Flow artwork slider (`ArtworkCarousel.tsx`) featuring 9 official Disney Lorcana key visuals.
   - Feathered ambient background layer with ultra-diffused, soft Gaussian blur lighting (`landingPageBackground1` & `landingPageBackground2`).

5. **Official Rule Engine & Sandbox Playmat (`LorcanaBoard.tsx`):**
   - Bounded card hand dock with hover-to-expand physics.
   - Single-ink-per-turn validation, dry/wet character turn cycles, non-inkable card rejections, and 0–20 Lore score counter.

---

## ⚡ Tech Stack

* **Frontend:** TypeScript 5.x, React 19+, Vite 6
* **Styling & Motion Engine:** Tailwind CSS v4, Framer Motion (`framer-motion`), Lucide Icons
* **State Management:** Zustand Store
* **Real-Time Protocol:** AWS API Gateway WebSockets Client
* **Backend Serverless Compute:** AWS Lambda (Node.js 20.x / Python 3.12)
* **Database & Storage:** Amazon DynamoDB (`UsersTable`, `DecksTable`, `RoomStateTable`), Amazon S3
* **Asynchronous Message Queue:** Amazon SQS
* **Security & Auth:** Custom Serverless Auth (bcrypt + JWT + API Gateway Lambda Authorizer)

---

## 🗂️ Project Directory Structure

```
DISNEY LORCANA PLAYLAB CLOUD/
├── 📄 CASE_STUDY.md         # Comprehensive Case Study, Engineering Guardrails & Technical Solutions
├── 📄 PLAN_PROJECT.md       # Master Execution Plan, Roadmap & Stage Deadlines
├── 📄 TEAM_WORKFLOW.md      # Team Role Allocations (6 Members) & Git Workflow Strategy
├── 📄 README.md             # Project repository guide (This file)
├── 📁 public/               # Public web assets, 3,129-card dataset, Ink symbols & Lorcana Artworks
│   ├── SymbolDisneylorcana/ # Official PNG Ink symbol assets (Amber, Amethyst, Emerald, Ruby, Sapphire, Steel)
│   └── artworkdisey/        # Official Disney key visuals & landing background layers
├── 📁 src/                  # React + Vite SPA Frontend
│   ├── components/          #Lorcanaboard, DeckBuilder, BoosterPackModal, Card3DInspectorModal, ArtworkCarousel
│   ├── services/            # REST API & WebSockets clients
│   ├── store/               # Zustand state stores
│   └── types/               # TypeScript domain interfaces
├── 📁 backend/              # AWS Serverless Lambda Functions (SAM Infrastructure-as-Code)
└── 📁 docs/                 # Architecture flowcharts & OpenAPI schemas
```

---

## 🚀 Quick Start & Development

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Yu-mai-wai-Yu-mai-wai/disney-lorcana-playlab-cloud.git
cd "DISNEY LORCANA PLAYLAB CLOUD"
npm install
```

### 2. Development Server
```bash
npm run dev
```

### 3. Production Build & Verification
```bash
npm run build
```

---

## 📖 Mandatory Reading List for Developers & AI Agents

* 📘 [CASE_STUDY.md](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/CASE_STUDY.md) — Case study & Agentic Engineering architecture.
* 📗 [PLAN_PROJECT.md](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/PLAN_PROJECT.md) — Master plan & MVP roadmap.
* 📙 [TEAM_WORKFLOW.md](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/TEAM_WORKFLOW.md) — Team roles and Git strategy.

---
*Disney Lorcana PlayLab Cloud &copy; 2026 — Course Project for Cloud Technology, KMITL IT*
