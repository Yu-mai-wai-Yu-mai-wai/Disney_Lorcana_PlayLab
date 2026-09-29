import { SQSEvent, SQSBatchResponse } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { analyzeDeck } from '../../shared/deckAnalysis';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const DECKS_TABLE = process.env.DECKS_TABLE || 'DecksTable';

// Partial batch response: the event source mapping must have FunctionResponseTypes=ReportBatchItemFailures.
// Failed records go back to the queue and, after maxReceiveCount tries, land in the DLQ.
export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: { itemIdentifier: string }[] = [];

  for (const record of event.Records) {
    try {
      const { deckId, userId, cards } = JSON.parse(record.body);
      if (!deckId || !userId || !Array.isArray(cards)) throw new Error('invalid deck message: deckId, userId and cards[] are required');

      await docClient.send(
        new UpdateCommand({
          TableName: DECKS_TABLE,
          Key: { deckId, userId },
          UpdateExpression: 'SET analysis = :analysis',
          ExpressionAttributeValues: { ':analysis': analyzeDeck(cards) },
        })
      );
    } catch (err) {
      console.error('Error processing record', record.messageId, err);
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  }

  return { batchItemFailures };
};
