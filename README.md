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

Disney Lorcana PlayLab Cloud is a high-performance web application engineered for Disney Lorcana TCG players to test single-player deck sandbox interactions, open 3D physical booster packs, inspect official cards in 3D holographic foil, simulate real-time 2-player match coordinates via AWS WebSockets (with room codes & ranked matchmaking), and analyze deck ink curves asynchronously. It runs on AWS within AWS Academy Learner Lab constraints: ALB + EC2 Auto Scaling for the web app and REST API, API Gateway WebSocket + Lambda for realtime matches.

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

## ☁️ Cloud Architecture & Infrastructure Modes

Disney Lorcana PlayLab Cloud supports **two production infrastructure modes** designed specifically to meet academic criteria (Stage 2 & Stage 3) while strictly guarding the **$50 AWS Academy Learner Lab budget**:

### 1. 🏆 Primary IaaS Mode: Lean Multi-AZ VPC + EC2 Auto Scaling (Full Score Stack)

```
                       Internet (User Browser / Evaluator)
                                      │
                                      ▼ HTTP:80
                     ┌─────────────────────────────────┐
                     │ Application Load Balancer (ALB) │
                     │ Public Multi-AZ: us-east-1a/1b  │
                     └────────────────┬────────────────┘
                                      │ Health Check /health (Port 80)
               ┌──────────────────────┴──────────────────────┐
               │                                             │
               ▼                                             ▼
  ┌─────────────────────────┐                   ┌─────────────────────────┐
  │ EC2 Instance 1 (AZ 1a)  │                   │ EC2 Instance 2 (AZ 1b)  │
  │ Amazon Linux 2023       │                   │ (Auto Scaled CPU > 60%) │
  │ ┌─────────────────────┐ │                   │ ┌─────────────────────┐ │
  │ │ Nginx (Port 80)     │ │                   │ │ Nginx (Port 80)     │ │
  │ │ React 19 SPA Build  │ │                   │ │ React 19 SPA Build  │ │
  │ └──────────┬──────────┘ │                   │ └──────────┬──────────┘ │
  │            │ Proxy :3001│                   │            │ Proxy :3001│
  │ ┌──────────▼──────────┐ │                   │ ┌──────────▼──────────┐ │
  │ │ Node.js Express+WS  │ │                   │ │ Node.js Express+WS  │ │
  │ │ REST API & Engine   │ │                   │ │ REST API & Engine   │ │
  │ └──────────┬──────────┘ │                   │ └──────────┬──────────┘ │
  └────────────┼────────────┘                   └────────────┼────────────┘
               │                                             │
               └──────────────────────┬──────────────────────┘
                                      │ IAM LabInstanceProfile (IMDSv2)
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
         ┌─────────────────────┐             ┌─────────────────────┐
         │   Amazon DynamoDB   │             │     Amazon SQS      │
         │  Users, Decks, Room │             │   Deck-Analyzer     │
         └─────────────────────┘             └─────────────────────┘
```

* **No NAT Gateway:** Public Multi-AZ subnets with tight Security Groups (ALB accepts port 80; EC2 accepts port 80 only from the ALB SG). Saves about $32.40/month vs a NAT Gateway. Public IPv4 addresses are still billed ($0.005/hr each).
* **Auto Scaling Group (ASG):** Min 2, Desired 2 (one instance per AZ), Max 4, target tracking on average CPU 60%. Health check is ELB-based on `/api/health` (goes through Node, not just nginx).
* **Node.js cluster:** one worker per vCPU (`backend/cluster.ts`). A single process capped CPU at 50% on the 2-vCPU t3.micro, so the 60% target could never fire.
* **Secrets:** `JWT_SECRET`, `ADMIN_PASSCODE`, SQS URL come from SSM Parameter Store at boot. The backend refuses to start in production without them. IMDSv2 is required.
* **HA evidence:** CloudWatch alarm `lorcana-unhealthy-hosts` (UnHealthyHostCount > 0). Results: [`docs/01_Reports/STAGE3_EXPERIMENT_RESULTS.md`](docs/01_Reports/STAGE3_EXPERIMENT_RESULTS.md).
* **S3 Decommissioning:** Frontend is served directly via high-performance Nginx Reverse Proxy on EC2 (replacing S3 Static Hosting).

---

### 2. Realtime tier: API Gateway WebSocket + Lambda

Realtime match traffic does not go to EC2. The SPA connects to `LorcanaPlayLabWebSocketApi` (stage `prod`), handled by Lambda `lorcana-room`, with room state in DynamoDB. Players served by different EC2 instances can play together, and an EC2 failure does not drop a match.
* **Source:** `backend/serverless/` (restored Lambda source + SAM template)
* **Legacy:** the HTTP API + auth/deck Lambdas from the old serverless mode still exist; they now read `JWT_SECRET` from the same SSM value (synced by `lab.ps1 publish`)

---

## ⚡ Tech Stack

* **Frontend:** TypeScript 5.x, React 19+, Vite 6, Tailwind CSS v4, Framer Motion, Zustand
* **Compute & IaaS:** Amazon EC2 (`t3.micro`), Amazon Linux 2023, Nginx Reverse Proxy, Node.js 20.x, Docker & Docker Compose
* **Network & Scaling:** Custom Multi-AZ VPC (`10.0.0.0/16`), Application Load Balancer (ALB), Target Groups, Auto Scaling Groups (ASG), CloudWatch Metrics
* **Data & Storage:** Amazon DynamoDB (on-demand, TTL enabled), Amazon SQS (Async Analyzer)
* **Auth & Security:** Custom bcrypt (10 rounds) + JWT Auth, IAM `LabInstanceProfile`, IMDSv2 Token Security
* **QA & Load Testing:** Playwright E2E (49/50 pass rate), Vitest Unit Suite (33/33 pass rate), Apache Benchmark / Custom Load Stress Scripts

---

## 🗂️ Project Directory Structure

```
DISNEY_LORCANA_PLAYLAB_CLOUD/
├── 📄 README.md               # Master technical documentation & runbooks
├── 📄 LICENSE                 # MIT License (source code only — game assets excluded)
├── 📄 CASE_STUDY.md           # Architecture decisions & engineering case study
├── 📄 PLAN_PROJECT.md         # Master execution plan & stage deadlines
├── 📄 TEAM_WORKFLOW.md        # Team roles (6 members) & git workflow
├── 📄 Dockerfile              # Multi-stage Dockerfile (<100MB Alpine build)
├── 📄 docker-compose.yml      # Orchestrates Nginx + Node.js containers
├── 📄 nginx.conf              # Nginx Web Server + Reverse Proxy + /health endpoint
├── 📁 backend/                # Unified Express + WebSocket Server & Lambda Handlers
│   ├── server.ts              # Unified Server (Node.js Port 3001)
│   ├── package.json           # Express, ws, cors, dotenv
│   └── tsconfig.json          # TypeScript build config
├── 📁 src/                    # React 19 SPA frontend
├── 📁 public/dataset/         # Official card dataset (lorcana_set1_set2.json)
├── 📁 docs/                   # Reports (Stage 2), Slides, QA Test Plans, References & Archive
│   ├── README.md              # Master Documentation Index & architecture guide
│   ├── 01_Reports/            # Stage 2 comprehensive report (Markdown), progress summary & evidence
│   ├── 02_Slides/             # Presentation slide decks (HTML interactive decks)
│   ├── 03_QA_Testing/         # QA Test Plans, reports & agent plans
│   ├── 04_References/         # Course guidelines, manuals & assets
│   └── _ARCHIVE/              # Historical drafts & legacy Serverless reports (Aug 20 & 24)
└── 📁 scripts/                # Deployment, lifecycle & load-testing utilities
    ├── deploy_ec2_vpc_asg.ps1 # 1-Click IaaS Deployer (VPC, ALB, LT, ASG)
    ├── lab_start.ps1          # Scale to 2 (Start Lab Demo, one per AZ)
    ├── lab_stop.ps1           # Scale to 0 ($0.00 Cost Protection)
    ├── stress_test.ps1        # Auto Scaling Load Generator & Verification
    ├── lab.ps1                # start | stop | status | publish | destroy
    ├── test_asg_recovery.ps1  # Failover test (app failure via SSM, or terminate)
    └── lab_destroy.ps1        # Complete infrastructure teardown (wraps lab.ps1 destroy)
```

---

## 🚀 Quick Start & Deployment Guide

### Local Development
```bash
git clone https://github.com/Yu-mai-wai-Yu-mai-wai/disney-lorcana-playlab-cloud.git
cd disney-lorcana-playlab-cloud
npm install
npm run dev          # Vite dev server at :3000
npm test             # Run 33 Vitest unit tests
```

### 1-Click AWS Lean VPC & Auto Scaling Deployment (IaaS)
```powershell
cd scripts
# Deploy Lean Multi-AZ VPC + ALB + Launch Template + Auto Scaling Group
.\deploy_ec2_vpc_asg.ps1 -Region us-east-1 -InstanceType t3.micro
```

### $50 Budget Lifecycle Controls (Cost Guardrails)
```powershell
# Start / Scale Up for Demo (Min/Desired = 2, one instance per AZ)
.\lab_start.ps1

# Scale to Zero when done (EC2 cost stops; ALB still bills ~$0.03/hr -> use destroy for long breaks)
.\lab_stop.ps1

# Run Load Stress Test to trigger CPU Scaling (>60%) for Stage 2/3 Evidence
.\stress_test.ps1 -DurationSeconds 360 -Concurrency 40 -StressUser stress_bot_<date>

# Build + upload SPA/backend to S3, sync JWT to Lambdas, replace instances one at a time
.\lab.ps1 publish

# App-failure failover test (stops Node on one instance via SSM, prints recovery timeline)
.\test_asg_recovery.ps1 -FailureMode app

# Complete teardown when not using the lab for a while
.\lab.ps1 destroy
```

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

## 👥 Team (Disney Lorcana Cloud Team — KMITL IT)

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
