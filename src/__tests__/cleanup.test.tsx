import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { AdminBillingDashboardModal } from '../components/AdminBillingDashboardModal';
import { useAuthStore } from '../store/useAuthStore';

const SRC = resolve(__dirname, '..');
function prodFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === '__tests__' || name === 'tests') continue;
      prodFiles(p, out);
    } else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}
const read = (rel: string) => readFileSync(resolve(SRC, rel), 'utf-8');

describe('T14 ponytail cleanup: nothing in production code pretends to be live (TC-CLEAN-001..)', () => {
  it('TC-CLEAN-001 no mock WebSocket endpoint, no fake billing, no fake room id', () => {
    for (const f of prodFiles(SRC)) {
      const src = readFileSync(f, 'utf-8');
      expect(src, `${f}: demo.execute-api`).not.toContain('demo.execute-api');
      expect(src, `${f}: fallbackBilling`).not.toContain('fallbackBilling');
      expect(src, `${f}: fake room 108249`).not.toContain('108249');
      expect(src, `${f}: admin passcode in UI`).not.toContain('LORCANA_ADMIN_2026');
    }
  });

  it('TC-CLEAN-002 STATE_SYNC_RESPONSE payload is built in one place', () => {
    const board = read('components/LorcanaBoard.tsx');
    expect(board.match(/sendAction\('STATE_SYNC_RESPONSE'/g)?.length).toBe(1);
  });

  it('TC-CLEAN-003 no side effects inside setState updaters for the undo and disconnect timers', () => {
    const board = read('components/LorcanaBoard.tsx');
    expect(board).not.toMatch(/setUndoVoteTimer\(\s*\(?prev\)?\s*=>/);
    expect(board).not.toMatch(/setDisconnectCountdown\(\s*\(?prev\)?\s*=>/);
  });
});

const BILLING = {
  accountId: '1',
  budgetTotal: 50,
  monthToDateSpend: 12.34,
  forecastSpend: 20,
  remainingBudget: 37.66,
  budgetUsagePercent: 24.68,
  currentHourlyBurnRate: 0.0791,
  cloudStatus: 'running',
  services: [{ name: 'Elastic Load Balancing', category: 'Network', cost: 7.13, percentage: 57.8, status: 'Active' }],
  resourceTelemetry: { asgDesired: 2, asgCurrent: 2, albCount: 1, ec2Running: 2, dynamoTables: 4, sqsQueues: 1 },
  lastUpdated: '10:00:00',
};

describe('Admin billing modal (TC-CLEAN-004..)', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { username: 'root', role: 'admin' } as any, token: 't', isAuthenticated: true } as any);
  });

  it('TC-CLEAN-004 API down: shows an error, not made-up numbers', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('offline')) as any;
    const { container } = render(<AdminBillingDashboardModal isOpen onClose={() => {}} />);
    await screen.findByTestId('billing-error');
    for (const fake of ['9.77', '90.23', '953899323223', 'ZERO-COST STANDBY']) {
      expect(container.textContent, fake).not.toContain(fake);
    }
  });

  it('TC-CLEAN-005 HTTP 500: shows an error as well', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'boom' }) }) as any;
    render(<AdminBillingDashboardModal isOpen onClose={() => {}} />);
    await screen.findByTestId('billing-error');
  });

  it('TC-CLEAN-006 real data is rendered as given; running stack is not labelled as zero-cost', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: BILLING }) }) as any;
    const { container } = render(<AdminBillingDashboardModal isOpen onClose={() => {}} />);
    await waitFor(() => expect(container.textContent).toContain('$12.34'));
    expect(container.textContent).toContain('$37.66');
    expect(container.textContent).toContain('0.0791');
    expect(container.textContent).not.toContain('9.77');
    expect(container.textContent).not.toContain('ZERO-COST STANDBY');
    expect(container.textContent).not.toContain('(Destroyed)');
  });

  it('TC-CLEAN-007 static snapshot from the server is labelled as a snapshot, not live', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { ...BILLING, source: 'static-snapshot', asOf: '2026-09-27' } }) }) as any;
    render(<AdminBillingDashboardModal isOpen onClose={() => {}} />);
    const note = await screen.findByTestId('billing-snapshot-note');
    expect(note.textContent).toContain('2026-09-27');
  });

  it('TC-CLEAN-008 locked screen (non-admin) does not print any passcode hint', () => {
    useAuthStore.setState({ user: { username: 'player', role: 'user' } as any, token: 't', isAuthenticated: true } as any);
    const { container } = render(<AdminBillingDashboardModal isOpen onClose={() => {}} />);
    expect(container.textContent).not.toContain('Master Key');
    expect(container.textContent).not.toContain('LORCANA_ADMIN_2026');
  });
});
