import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const MATCH_HISTORY_TABLE = process.env.MATCH_HISTORY_TABLE || 'LorcanaMatchHistory';

interface MatchEventPayload {
  eventType: string;
  matchId: string;
  winner: string;
  loser: string;
  winnerLore: number;
  loserLore: number;
  turns?: number;
  finishedAt: string;
}

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const parsedBody = JSON.parse(record.body);
      const data: MatchEventPayload =
        typeof parsedBody.Message === 'string'
          ? JSON.parse(parsedBody.Message)
          : parsedBody.Message || parsedBody;

      if (!data.matchId || !data.winner || !data.loser || data.winnerLore === undefined || data.loserLore === undefined) {
        throw new Error(`Invalid match event payload: matchId, winner, loser, winnerLore, loserLore are required`);
      }

      const finishedAt = data.finishedAt || new Date().toISOString();
      const sortKey = `${finishedAt}#${data.matchId}`;

      // 1. Record for Winner
      await docClient.send(
        new PutCommand({
          TableName: MATCH_HISTORY_TABLE,
          Item: {
            userId: data.winner,
            'finishedAt#matchId': sortKey,
            matchId: data.matchId,
            opponent: data.loser,
            result: 'WIN',
            myLore: data.winnerLore,
            opponentLore: data.loserLore,
            turns: data.turns || 1,
            finishedAt,
          },
        })
      );

      // 2. Record for Loser
      await docClient.send(
        new PutCommand({
          TableName: MATCH_HISTORY_TABLE,
          Item: {
            userId: data.loser,
            'finishedAt#matchId': sortKey,
            matchId: data.matchId,
            opponent: data.winner,
            result: 'LOSS',
            myLore: data.loserLore,
            opponentLore: data.winnerLore,
            turns: data.turns || 1,
            finishedAt,
          },
        })
      );
    } catch (err) {
      console.error('[MatchHistory Handler Error] Record failed:', record.messageId, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
