// Leaderboard cache-aside measurement (Stage 3, T05).
// Usage: node scripts/measure_leaderboard.mjs http://<alb-dns> [rounds=8] [hitsPerRound=13]
// Each round: wait until the 60 s cache TTL has expired, send one request (expected X-Cache: MISS),
// then send hitsPerRound requests back to back (expected HIT). Samples are bucketed by the X-Cache header
// the server actually returned. serverMs = durationMs measured inside the backend; clientMs = wall time seen
// from this machine (includes the network round trip to the ALB).
import { mkdirSync, writeFileSync } from 'node:fs';

const base = (process.argv[2] || process.env.E2E_BASE_URL || '').replace(/\/$/, '');
const rounds = Number(process.argv[3] || 8);
const hitsPerRound = Number(process.argv[4] || 13);
if (!base) throw new Error('give the ALB base URL as the first argument');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const samples = [];

async function sample() {
  const t = performance.now();
  const res = await fetch(`${base}/api/leaderboard`);
  const body = await res.json();
  const clientMs = Math.round((performance.now() - t) * 10) / 10;
  samples.push({ cache: res.headers.get('x-cache'), status: res.status, source: body.source, serverMs: body.durationMs, clientMs });
}

for (let r = 1; r <= rounds; r++) {
  console.log(`round ${r}/${rounds}: waiting 62 s for the cache TTL to expire`);
  await sleep(62_000);
  await sample();
  for (let i = 0; i < hitsPerRound; i++) await sample();
}

const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)]; };
const stats = (a) => (a.length ? { n: a.length, min: Math.min(...a), median: q(a, 50), p95: q(a, 95), max: Math.max(...a) } : { n: 0 });
const summary = {};
for (const k of ['MISS', 'HIT']) {
  const rows = samples.filter((s) => s.cache === k);
  summary[k] = { serverMs: stats(rows.map((s) => s.serverMs)), clientMs: stats(rows.map((s) => s.clientMs)) };
}
const out = { at: new Date().toISOString(), base, rounds, hitsPerRound, non200: samples.filter((s) => s.status !== 200).length, summary, samples };
const dir = new URL('../docs/01_Reports/stage3_evidence/', import.meta.url);
mkdirSync(dir, { recursive: true });
const file = new URL(`leaderboard_cache_${out.at.replace(/[:.]/g, '-')}.json`, dir);
writeFileSync(file, JSON.stringify(out, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log('evidence:', file.pathname);
