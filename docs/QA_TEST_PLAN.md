# QA Test Plan & Automation Log — Disney Lorcana PlayLab Cloud

> **Full QA Campaign (Stage 2)** — Frontend UX/UI, Backend, AWS Cloud
> Methodology grounded in [practical-testing principles](https://practical-testing.gitbook.io/home): deterministic tests, tests as production code, confidence over coverage metrics.

---

## 📊 Executive Summary

| Category | Cases | Pass | Fail | Blocked | Technique Coverage |
|---|---:|---:|---:|---:|---|
| **UX/UI (Playwright E2E)** | 15 | 14 | 0 | 1 | Heuristic Audit, Negative Testing, State Transition, Responsive Audit, Empty State |
| **Backend (Lambda invoke จริง)** | 20 | 20 | 0 | 0 | Integration, Equivalence Partitioning, Boundary Value, State Transition |
| **AWS Cloud (CLI + API จริง)** | 15 | 15 | 0 | 0 | OWASP A01–A07 mapping, WAF Pillar Audits, Penetration Test |
| **รวม** | **50** | **49** | **0** | **1** | |

- **Pass rate: 98%** (49/50) — 1 Blocked = TC-UXUI-015 (Logout button ยังไม่มีใน build → backlog item)
- Test execution date: 2026-08-24
- Environment: AWS Learner Lab (Account 953899323223), test users `io5`, `qa-test-p1`, `qa-test-p2`

---

## 🐛 Bugs Found & Fixed During Campaign (Evidence of Real Testing)

### BUG-01 — OWASP A01: Broken Access Control (Critical)
- **Location:** `backend/deck/handler.ts` line 82-83
- **Symptom:** `verifyToken()` fail → fallback `userId='anonymous_guest'` → unauthenticated users could list/save decks
- **Discovered by:** TC-AWS-006/007 (tampered JWT + garbage token)
- **Fix:** Reject with `401 Unauthorized` when token invalid; redeployed `lorcana-deck` Lambda
- **Re-test:** ✅ PASS (returns 401)

### BUG-02 — API Gateway Throttling Missing (Medium)
- **Location:** HTTP API stage `prod`
- **Symptom:** No default throttling limits configured
- **Discovered by:** TC-AWS-003
- **Fix:** Set `ThrottlingBurstLimit=100, ThrottlingRateLimit=50`
- **Re-test:** ✅ PASS

### BACKLOG-01 — Logout UI Missing (Low)
- **Discovered by:** TC-UXUI-015
- **Detail:** Navbar shows user badge but no logout action in dropdown
- **Status:** Backlog for next sprint

---

## 🧪 Test Suites

### 1. UX/UI Suite — `e2e/qa-campaign-uxui.spec.ts` (TC-UXUI-001..015)
Playwright Chromium E2E against dev server. Covers:
- Landing page completeness (TC-001)
- Auth flows: modal open, empty submit blocked, wrong password error, valid login (TC-002..005)
- Match lobby deck selection + room code input behavior (TC-006, 007)
- Deck builder search "Mickey" against 3,242-card dataset (TC-008)
- Board responsive at 1280px/1920px without overflow (TC-010)
- Sandbox empty state, Analytics render, Rules content (TC-011..013)
- TH/EN language toggle instant switch (TC-014)

### 2. Backend Suite — `qa/backend-aws-runner.cjs` (TC-BE-001..020)
Direct AWS Lambda invocation (`aws lambda invoke`) — proves IAM, DynamoDB integration, and payload contracts end-to-end:
- Auth: register (+bcrypt hash never leaked), duplicate rejection, login success/wrong-password, JWT structure claims (TC-BE-001..005)
- Rooms: CREATE_ROOM 6-digit format, JOIN valid/not-found/full, LEAVE_ROOM hard-delete, $disconnect grace period, REJOIN within grace / stranger rejected (TC-BE-006..013)
- Relay: CARD_MOVED, LORE_UPDATED broadcast integrity (TC-BE-014, 015)
- Matchmaking: queue, auto-pair, cancel (TC-BE-016..018)
- Resilience: TTL attribute on writes (~7200s), malformed JSON body no-crash (TC-BE-019, 020)

### 3. AWS Cloud Suite — same runner (TC-AWS-001..015)
OWASP Top 10 (Web) + Well-Architected pillar mapping:
- **A01 Broken Access Control:** LabRole least-privilege audit (TC-AWS-001), JWT tamper/garbage rejection (TC-AWS-006, 007)
- **A02 Cryptographic Failures:** HTTPS enforcement (TC-AWS-002), password-hash non-exposure (TC-AWS-008)
- **A03 Injection:** SQLi payload via login (N/A-by-design proof, DynamoDB), XSS storage check (TC-AWS-004, 005)
- **A04/A05:** Throttling config, CORS posture (TC-AWS-003, 014)
- **Reliability Pillar:** DynamoDB TTL enabled, SQS + event-source mapping (DLQ documented as roadmap), Multi-AZ serverless SPOF check (TC-AWS-011..013)
- **Cost Pillar:** Billing alarms $5/$20 exist, EstimatedCharges = **$0.00** within budget (TC-AWS-010, 015)

---

## 📡 Real-Time Dashboard

```bash
node qa/dashboard-server.cjs   # → http://localhost:9200
```

- Master sheet: `qa/master-sheet.json` — schema per practical-testing template:
  `Test CaseID | Module | Description | Pre-condition | Steps | Expected | Actual | Status | Remark/Bug ID | Technique`
- **Custom Playwright Reporter** (`qa/qa-reporter.cjs`) hooks `onTestEnd` → POSTs to `/api/update` the moment each test finishes
- Backend/AWS runner pushes after each assertion block
- Dashboard auto-refreshes via SSE + polling; summary cards show live pass/fail/blocked counts
- Re-run any suite → statuses update automatically (no manual sheet editing)

## ▶️ How to Reproduce

```bash
npm run dev                                    # terminal 1 (web app :3000)
node qa/dashboard-server.cjs                   # terminal 2 (sheet :9200)
npx playwright test e2e/qa-campaign-uxui.spec.ts   # UXUI → live updates
node qa/backend-aws-runner.cjs                 # Backend + AWS (35 checks)
```

Requires: AWS CLI configured to Learner Lab session token.
