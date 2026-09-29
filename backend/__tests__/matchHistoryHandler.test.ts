import { describe, it, expect, beforeEach, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: class {} }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send: sendMock }) },
  PutCommand: class {
    constructor(public input: any) {}
  },
}));

import { handler } from '../serverless/match-history/handler';

const rec = (messageId: string, body: unknown) => ({
  messageId,
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const matchPayload = (matchId: string, winner: string, loser: string) => ({
  eventType: 'match.finished',
  matchId,
  winner,
  loser,
  winnerLore: 20,
  loserLore: 14,
  turns: 7,
  finishedAt: '2026-09-29T12:30:00.000Z',
});

const snsRec = (messageId: string, payload: any) =>
  rec(messageId, {
    Type: 'Notification',
    MessageId: `sns-${messageId}`,
    Message: JSON.stringify(payload),
  });

const run = (...records: any[]) => (handler as any)({ Records: records });

describe('MatchHistory Lambda consumer (T04)', () => {
  beforeEach(() => {
    sendMock.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('TC-HIST-01: Writes 2 items to LorcanaMatchHistory (one for winner, one for loser)', async () => {
    sendMock.mockResolvedValue({});
    const res = await run(snsRec('msg-h1', matchPayload('match-100', 'elsa', 'anna')));

    expect(res).toEqual({ batchItemFailures: [] });
    expect(sendMock).toHaveBeenCalledTimes(2);

    const winnerItem = sendMock.mock.calls[0][0].input.Item;
    expect(winnerItem.userId).toBe('elsa');
    expect(winnerItem['finishedAt#matchId']).toBe('2026-09-29T12:30:00.000Z#match-100');
    expect(winnerItem.result).toBe('WIN');
    expect(winnerItem.opponent).toBe('anna');
    expect(winnerItem.myLore).toBe(20);
    expect(winnerItem.opponentLore).toBe(14);

    const loserItem = sendMock.mock.calls[1][0].input.Item;
    expect(loserItem.userId).toBe('anna');
    expect(loserItem['finishedAt#matchId']).toBe('2026-09-29T12:30:00.000Z#match-100');
    expect(loserItem.result).toBe('LOSS');
    expect(loserItem.opponent).toBe('elsa');
    expect(loserItem.myLore).toBe(14);
    expect(loserItem.opponentLore).toBe(20);
  });

  it('TC-HIST-02: Reports record in batchItemFailures if DynamoDB write fails', async () => {
    sendMock.mockRejectedValueOnce(new Error('DynamoDB write error'));
    const res = await run(snsRec('msg-fail', matchPayload('match-fail', 'elsa', 'anna')));

    expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'msg-fail' }]);
  });

  it('TC-HIST-03: Reports record in batchItemFailures if JSON payload is malformed', async () => {
    const res = await run(rec('msg-bad-json', 'not-valid-json'));
    expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'msg-bad-json' }]);
  });
});
