import { test, expect, APIRequestContext } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Content caching of the 2.35 MB card-data file (T02). Runs against the deployed ALB only.
const NEEDS_STACK = 'needs deployed stack: set E2E_BASE_URL=http://<alb-dns>';

// Find the card-data URL the way the browser does: index.html -> entry bundle -> the URL string it fetches
async function findDatasetUrl(request: APIRequestContext, baseURL: string): Promise<string> {
  const html = await (await request.get(`${baseURL}/`)).text();
  const scripts = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  for (const s of scripts) {
    const js = await (await request.get(`${baseURL}${s}`)).text();
    const m = js.match(/["'`](\/(?:assets|dataset)\/[\w.-]*lorcana[\w.-]*\.json)["'`]/);
    if (m) return m[1];
  }
  throw new Error('card data URL not found in the entry bundle');
}

test('TC-E2E-20: card data is a hashed asset, cached for 1 year (immutable) and gzip-compressed (ALB only)', async ({ request, baseURL }) => {
  test.skip(!process.env.E2E_BASE_URL, NEEDS_STACK);
  const url = await findDatasetUrl(request, baseURL!);
  expect(url).toMatch(/^\/assets\/lorcana_cards-[\w-]{6,}\.json$/);

  const res = await request.get(`${baseURL}${url}`, { headers: { 'Accept-Encoding': 'gzip' } });
  expect(res.status()).toBe(200);
  const cc = res.headers()['cache-control'] ?? '';
  expect(cc).toContain('max-age=31536000');
  expect(cc).toContain('immutable');
  expect(res.headers()['content-encoding']).toBe('gzip');
  expect(res.headers()['x-content-type-options']).toBe('nosniff'); // security headers survive the location block
});

test('TC-E2E-21: index.html is always revalidated so a new deploy is picked up (ALB only)', async ({ request, baseURL }) => {
  test.skip(!process.env.E2E_BASE_URL, NEEDS_STACK);
  const home = await request.get(`${baseURL}/`);
  const cc = home.headers()['cache-control'] ?? '';
  expect(cc).toContain('no-cache');
  expect(cc).not.toContain('immutable');
  expect(home.headers()['x-frame-options']).toBe('DENY');
});

test('TC-E2E-22: second load of the card data comes from the browser cache, no bytes over the network (ALB only)', async ({ page, request, baseURL }) => {
  test.skip(!process.env.E2E_BASE_URL, NEEDS_STACK);
  test.setTimeout(90000); // the evidence run also downloads the uncompressed 2.35 MB
  const url = await findDatasetUrl(request, baseURL!);
  await page.goto(`${baseURL}/`);

  const r = await page.evaluate(async (u) => {
    const get = async () => {
      const t = performance.now();
      const res = await fetch(u);
      const bytes = (await res.arrayBuffer()).byteLength;
      return { ms: Math.round(performance.now() - t), bytes };
    };
    const first = await get();
    const second = await get();
    const abs = new URL(u, location.href).href;
    const last = (performance.getEntriesByName(abs) as PerformanceResourceTiming[]).pop()!;
    return { first, second, secondTransferSize: last.transferSize, encodedBodySize: last.encodedBodySize, decodedBodySize: last.decodedBodySize };
  }, url);

  expect(r.secondTransferSize).toBe(0); // served from cache
  expect(r.encodedBodySize).toBeGreaterThan(0);
  expect(r.encodedBodySize).toBeLessThan(r.decodedBodySize / 2); // travelled compressed

  if (process.env.E2E_EVIDENCE) {
    const raw = await request.get(`${baseURL}${url}`, { headers: { 'Accept-Encoding': 'identity' } });
    const dir = resolve(process.cwd(), 'docs/01_Reports/stage3_evidence'); // playwright runs from the repo root
    mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    writeFileSync(
      resolve(dir, `caching_${stamp}.json`),
      JSON.stringify({ at: new Date().toISOString(), baseURL, url, uncompressedBytes: (await raw.body()).length, ...r }, null, 2)
    );
  }
});
