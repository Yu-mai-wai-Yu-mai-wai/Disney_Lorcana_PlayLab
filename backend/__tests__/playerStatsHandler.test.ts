import { describe, it, expect, beforeEach, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: class {} }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send: sendMock }) },
  PutCommand: class {
    constructor(public input: any) {}
  },
  UpdateCommand: class {
    constructor(public input: any) {}
  },
}));

import { handler } from '../serverless/player-stats/handler';

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
  turns: 9,
  finishedAt: '2026-09-29T12:00:00.000Z',
});

// Wrapped in SNS message structure as delivered by SNS -> SQS
const snsRec = (messageId: string, payload: any) =>
  rec(messageId, {
    Type: 'Notification',
    MessageId: `sns-${messageId}`,
    Message: JSON.stringify(payload),
  });

const run = (...records: any[]) => (handler as any)({ Records: records });

describe('PlayerStats Lambda consumer & Deduplication (T04)', () => {
  beforeEach(() => {
    sendMock.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('TC-STATS-01: Processes a new match, records dedupe item and updates winner and loser', async () => {
    sendMock.mockResolvedValue({});
    const res = await run(snsRec('msg-1', matchPayload('match-001', 'alice', 'bob')));

    expect(res).toEqual({ batchItemFailures: [] });
    // 1 PutCommand (dedupe) + 2 UpdateCommand (winner, loser)
    expect(sendMock).toHaveBeenCalledTimes(3);

    const putCall = sendMock.mock.calls[0][0].input;
    expect(putCall.Item.userId).toBe('DEDUPE#match-001');
    expect(putCall.ConditionExpression).toBe('attribute_not_exists(userId)');

    const winnerUpdate = sendMock.mock.calls[1][0].input;
    expect(winnerUpdate.Key).toEqual({ userId: 'alice' });
    expect(winnerUpdate.UpdateExpression).toContain('ADD wins :one, games :one');

    const loserUpdate = sendMock.mock.calls[2][0].input;
    expect(loserUpdate.Key).toEqual({ userId: 'bob' });
    expect(loserUpdate.UpdateExpression).toContain('ADD losses :one, games :one');
  });

  it('TC-STATS-02: Idempotent - same matchId received a second time is deduplicated and not counted twice', async () => {
    // Simulate conditional check failed for the dedupe PutCommand
    const condErr: any = new Error('ConditionalCheckFailed');
    condErr.name = 'ConditionalCheckFailedException';
    sendMock.mockRejectedValueOnce(condErr);

    const res = await run(snsRec('msg-2', matchPayload('match-001', 'alice', 'bob')));

    // Acknowledged as success without failures
    expect(res).toEqual({ batchItemFailures: [] });
    // Only the PutCommand was called; winner and loser stats were NOT updated!
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('TC-STATS-03: Reports failed records in batchItemFailures on DynamoDB error', async () => {
    sendMock.mockRejectedValueOnce(new Error('Internal DynamoDB Error'));
    const res = await run(snsRec('msg-err', matchPayload('match-err', 'alice', 'bob')));

    expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'msg-err' }]);
  });

  it('TC-STATS-04: Reports malformed payload in batchItemFailures', async () => {
    const res = await run(rec('msg-bad', 'invalid json body'));
    expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'msg-bad' }]);
  });
});
