import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const PLAYER_STATS_TABLE = process.env.PLAYER_STATS_TABLE || 'LorcanaPlayerStats';
const DEDUPE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days retention for dedupe markers

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

      if (!data.matchId || !data.winner || !data.loser) {
        throw new Error(`Invalid match event payload: matchId, winner, loser are required`);
      }

      // Step 1: Idempotency deduplication check via conditional write
      const dedupeKey = `DEDUPE#${data.matchId}`;
      let isDuplicate = false;
      try {
        await docClient.send(
          new PutCommand({
            TableName: PLAYER_STATS_TABLE,
            Item: {
              userId: dedupeKey,
              matchId: data.matchId,
              processedAt: new Date().toISOString(),
              ttl: Math.floor(Date.now() / 1000) + DEDUPE_TTL_SECONDS,
            },
            ConditionExpression: 'attribute_not_exists(userId)',
          })
        );
      } catch (err: any) {
        if (err.name === 'ConditionalCheckFailedException') {
          console.log(`[PlayerStats Handler] Match ${data.matchId} already processed. Skipping duplicate update.`);
          isDuplicate = true;
        } else {
          throw err;
        }
      }

      if (isDuplicate) {
        // Successfully deduplicated, message is acknowledged without double counting
        continue;
      }

      const now = data.finishedAt || new Date().toISOString();

      // Step 2: Atomic stats update for Winner (wins + 1, games + 1)
      await docClient.send(
        new UpdateCommand({
          TableName: PLAYER_STATS_TABLE,
          Key: { userId: data.winner },
          UpdateExpression: 'ADD wins :one, games :one, losses :zero SET updatedAt = :now',
          ExpressionAttributeValues: {
            ':one': 1,
            ':zero': 0,
            ':now': now,
          },
        })
      );

      // Step 3: Atomic stats update for Loser (losses + 1, games + 1)
      await docClient.send(
        new UpdateCommand({
          TableName: PLAYER_STATS_TABLE,
          Key: { userId: data.loser },
          UpdateExpression: 'ADD losses :one, games :one, wins :zero SET updatedAt = :now',
          ExpressionAttributeValues: {
            ':one': 1,
            ':zero': 0,
            ':now': now,
          },
        })
      );
    } catch (err) {
      console.error('[PlayerStats Handler Error] Record failed:', record.messageId, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
