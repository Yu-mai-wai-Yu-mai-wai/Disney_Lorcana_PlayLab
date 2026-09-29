import { describe, it, expect, beforeEach, vi } from 'vitest';

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock('@aws-sdk/client-dynamodb', () => ({ DynamoDBClient: class {} }));
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: () => ({ send: sendMock }) },
  UpdateCommand: class {
    constructor(public input: any) {}
  },
}));

import { handler } from '../serverless/analyzer/handler';

const CARDS = [{ card: { id: 'a', cost: 1, inkwell: true, ink: 'Amber', type: 'Character', lore: 1 }, count: 4 }];
const rec = (messageId: string, body: unknown) => ({ messageId, body: typeof body === 'string' ? body : JSON.stringify(body) });
const ok = (id: string) => rec(id, { deckId: `d_${id}`, userId: 'u', name: 'n', cards: CARDS });
const run = (...records: any[]) => (handler as any)({ Records: records });

describe('analyzer Lambda reports failed records so SQS can retry and dead-letter them (TC-DLQ-001..)', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('TC-DLQ-001 valid record: writes the analysis and reports no failures', async () => {
    const res = await run(ok('m1'));
    expect(res).toEqual({ batchItemFailures: [] });
    expect(sendMock).toHaveBeenCalledTimes(1);
    const cmd = sendMock.mock.calls[0][0].input;
    expect(cmd.Key).toEqual({ deckId: 'd_m1', userId: 'u' });
    expect(cmd.ExpressionAttributeValues[':analysis'].totalCards).toBe(4);
  });

  it('TC-DLQ-002 DynamoDB failure: record is reported, handler does not throw or swallow it', async () => {
    sendMock.mockRejectedValueOnce(new Error('ProvisionedThroughputExceeded'));
    const res = await run(ok('m2'));
    expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'm2' }]);
  });

  it('TC-DLQ-003 malformed JSON (poison message) is reported', async () => {
    const res = await run(rec('m3', '{not json'));
    expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'm3' }]);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('TC-DLQ-004 message missing deckId/userId/cards is reported, not silently skipped', async () => {
    const res = await run(rec('m4', { userId: 'u', cards: CARDS }), rec('m5', { deckId: 'd', userId: 'u' }));
    expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'm4' }, { itemIdentifier: 'm5' }]);
  });

  it('TC-DLQ-005 mixed batch: only the bad record is reported, the good ones are still processed', async () => {
    const res = await run(ok('a'), rec('bad', '{'), ok('c'));
    expect(res.batchItemFailures).toEqual([{ itemIdentifier: 'bad' }]);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
