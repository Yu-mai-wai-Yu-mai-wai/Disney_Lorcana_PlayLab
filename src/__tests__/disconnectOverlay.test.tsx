import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { OpponentDisconnectOverlay } from '../components/board/OpponentDisconnectOverlay';

// Reported by Tawan: the countdown shown when the opponent drops did not tick in real time.
// Cause: the timer lived in the big WebSocket effect, whose cleanup cleared it on every dependency change.
// The overlay now owns the timer and derives the value from a wall-clock deadline.
const base = { opponentLeftName: null, language: 'en', onExitMatch: undefined as undefined | (() => void) };
const secs = () => screen.getByTestId('grace-countdown').textContent;
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe('OpponentDisconnectOverlay countdown (TC-DISC-001..)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-29T12:00:00.000Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('TC-DISC-001 starts at 60s and ticks down every second', () => {
    render(<OpponentDisconnectOverlay {...base} isOpponentDisconnected />);
    expect(secs()).toBe('60s');
    advance(1000);
    expect(secs()).toBe('59s');
    advance(9000);
    expect(secs()).toBe('50s');
  });

  it('TC-DISC-002 a parent re-render (new props, new callbacks) does not stop or reset the countdown', () => {
    const { rerender } = render(<OpponentDisconnectOverlay {...base} isOpponentDisconnected onExitMatch={() => {}} />);
    advance(5000);
    rerender(<OpponentDisconnectOverlay {...base} isOpponentDisconnected onExitMatch={() => {}} language="th" />);
    expect(secs()).toBe('55s');
    advance(5000);
    expect(secs()).toBe('50s');
  });

  it('TC-DISC-003 follows the wall clock, so a throttled background tab still shows the right time', () => {
    render(<OpponentDisconnectOverlay {...base} isOpponentDisconnected />);
    vi.setSystemTime(Date.now() + 30_000); // 30 s pass while no timer callback ran
    advance(250);
    expect(secs()).toBe('30s');
  });

  it('TC-DISC-004 at 0 it says the grace period expired and offers Exit Match', () => {
    const onExit = vi.fn();
    render(<OpponentDisconnectOverlay {...base} isOpponentDisconnected onExitMatch={onExit} />);
    advance(61_000);
    expect(secs()).toBe('0s');
    fireEvent.click(screen.getByRole('button', { name: /Exit Match/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('TC-DISC-005 the countdown restarts from 60 on the next disconnect and stops when the opponent is back', () => {
    const { rerender } = render(<OpponentDisconnectOverlay {...base} isOpponentDisconnected />);
    advance(20_000);
    rerender(<OpponentDisconnectOverlay {...base} isOpponentDisconnected={false} />);
    // the exit animation may keep the node mounted in jsdom; what matters is that the number no longer moves
    const frozen = screen.queryByTestId('grace-countdown')?.textContent;
    advance(10_000);
    expect(screen.queryByTestId('grace-countdown')?.textContent).toBe(frozen);
    rerender(<OpponentDisconnectOverlay {...base} isOpponentDisconnected />);
    expect(secs()).toBe('60s');
  });
});
