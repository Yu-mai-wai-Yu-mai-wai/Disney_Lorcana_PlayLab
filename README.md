# 🪄 Disney Lorcana PlayLab Cloud

> **100% AWS Serverless Real-time Playground & Asynchronous Deck Analyzer**  
> *Course Project for Cloud Technology (1/2569), KMITL IT*

---

## 📌 Project Overview
Disney Lorcana PlayLab Cloud is a lightweight, high-performance web application designed for Disney Lorcana TCG players to test single-player deck interactions, simulate real-time 2-player match coordinates via WebSockets, and analyze deck ink curves asynchronously—all running on a **$0.00 AWS Free Tier** serverless infrastructure.

---

## ⚡ Tech Stack

*   **Language & Runtime:** TypeScript 5.x, React 19+, Vite 6
*   **Styling & Motion Engine:** Tailwind CSS v4, Framer Motion (`framer-motion`)
*   **State Management:** Zustand Store
*   **Real-Time Protocol:** WebSockets Client (AWS API Gateway WebSockets)
*   **Backend Serverless Compute:** AWS Lambda (Node.js 20.x / Python 3.12)
*   **Database & Storage:** Amazon DynamoDB (`UsersTable`, `DecksTable`, `RoomStateTable`), Amazon S3
*   **Asynchronous Message Queue:** Amazon SQS
*   **Security & Authentication:** Custom Serverless Auth (bcrypt + JWT + API Gateway Lambda Authorizer)
*   **Observability & CDN:** AWS CloudWatch, AWS CloudFront

---

## 🗂️ Project Directory Structure

```
DISNEY LORCANA PLAYLAB CLOUD/
├── 📄 PLAN_PROJECT.md       # Master Plan, Mandatory Reading List for Agents & Stage Deadlines
├── 📄 TEAM_WORKFLOW.md      # Team Role Allocations (6 Members) & Git Workflow Strategy
├── 📄 README.md             # Codebase repository guide (This file)
├── 📄 .gitignore            # Git ignore rules for node_modules, build, logs & secrets
├── 📁 public/               # Static assets & 408-card JSON dataset (Set 1 & Set 2)
├── 📁 src/                  # React + Vite SPA Frontend
│   ├── components/       # Lorcana Board UI, Drag-Drop, Deck Builder, Playmat selector
│   ├── services/         # REST API & WebSockets clients
│   └── assets/           # Design system tokens and styling
├── 📁 backend/              # AWS Serverless Lambda Functions
│   ├── auth/             # Custom Auth (bcrypt & JWT signing)
│   ├── deck/             # REST API Deck Manager (DynamoDB)
│   ├── room/             # WebSockets Room Router (<100ms sync)
│   └── analyzer/         # Async SQS Deck Synergy Analyzer
├── 📁 docs/                 # Architecture flowcharts & OpenAPI schemas
└── 📁 scripts/              # Build and AWS deployment automation scripts
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

---

## 🌿 Git Branching Strategy & Workflow

This project enforces a strict **Feature Branch Workflow** for the team of 6:

*   **`main`**: Production-ready, stable code only.
*   **`develop`**: Primary integration branch. All feature PRs target `develop`.
*   **`feature/<feature-name>`**: Individual feature branches created from `develop`.

### Branching Rules for Team Members:
1. Always branch off `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```
2. Commit with conventional prefixes: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`.
3. Submit a Pull Request (PR) to merge into `develop` with code review approval before merging.

For full team role allocations and Git guidelines, refer to [TEAM_WORKFLOW.md](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY%20LORCANA%20PLAYLAB%20CLOUD/TEAM_WORKFLOW.md).

---

## 📖 Mandatory Reading List for Developers & AI Agents
*   [PLAN_PROJECT.md](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY%20LORCANA%20PLAYLAB%20CLOUD/PLAN_PROJECT.md) — Master execution plan & MVP roadmap.
*   [TEAM_WORKFLOW.md](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY%20LORCANA%20PLAYLAB%20CLOUD/TEAM_WORKFLOW.md) — Team roles and Git instructions.
*   [Proposal PDF](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/Disney_Lorcana/01_Proposal/Cloud_Project_Proposal_Lorcana.pdf) — Academic project proposal.
*   [Slide Deck PDF](file:///D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/Disney_Lorcana/02_Presentations/Disney_Lorcana_SlideDeck_Magical_Disney.pdf) — Presentation slide deck.
