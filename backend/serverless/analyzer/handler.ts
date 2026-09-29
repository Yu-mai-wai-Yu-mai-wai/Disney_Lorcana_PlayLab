import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { analyzeDeck } from '../../shared/deckAnalysis';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const DECKS_TABLE = process.env.DECKS_TABLE || 'DecksTable';

export const handler = async (event: SQSEvent): Promise<any> => {
  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      const { deckId, userId, name, cards } = body;

      if (!deckId || !userId || !cards) continue;

      const analysis = analyzeDeck(cards);

      await docClient.send(new UpdateCommand({
        TableName: DECKS_TABLE,
        Key: { deckId, userId },
        UpdateExpression: 'SET analysis = :analysis',
        ExpressionAttributeValues: {
          ':analysis': analysis
        }
      }));

    } catch (err) {
      console.error("Error processing record", err);
    }
  }

  return { statusCode: 200 };
};
