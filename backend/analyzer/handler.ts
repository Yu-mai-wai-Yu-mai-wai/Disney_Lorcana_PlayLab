import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const DECKS_TABLE = process.env.DECKS_TABLE || 'DecksTable';

export const handler = async (event: SQSEvent): Promise<any> => {
  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      const { deckId, userId, name, cards } = body;

      if (!deckId || !userId || !cards) continue;

      let totalCards = 0;
      let totalCost = 0;
      let charactersCount = 0;
      let cardsWithCost = 0;

      const costCurve = {
        '0-2': 0,
        '3-4': 0,
        '5-6': 0,
        '7+': 0
      };

      const inkDistribution: Record<string, number> = {};

      for (const item of cards) {
        // Handle both { card: {...}, count } and flat card object
        const cardData = item.card || item;
        const count = item.count || 1;

        totalCards += count;

        if (cardData.cost !== undefined) {
          const cost = Number(cardData.cost);
          totalCost += cost * count;
          cardsWithCost += count;

          if (cost <= 2) costCurve['0-2'] += count;
          else if (cost <= 4) costCurve['3-4'] += count;
          else if (cost <= 6) costCurve['5-6'] += count;
          else costCurve['7+'] += count;
        }

        if (cardData.ink) {
          inkDistribution[cardData.ink] = (inkDistribution[cardData.ink] || 0) + count;
        }

        if (cardData.type === 'Character') {
          charactersCount += count;
        }
      }

      const avgCost = cardsWithCost > 0 ? Number((totalCost / cardsWithCost).toFixed(2)) : 0;
      const characterRatio = totalCards > 0 ? Number((charactersCount / totalCards).toFixed(2)) : 0;

      // Synergy Score Calculation (0-100)
      let synergyScore = 100;
      
      // Ink balance (max 2 inks is standard, penalty for > 2 or 0)
      const numInks = Object.keys(inkDistribution).length;
      if (numInks === 0) synergyScore -= 50;
      if (numInks > 2) synergyScore -= 30;

      // Character ratio (ideal 60-70%)
      if (characterRatio < 0.6) synergyScore -= 20;
      else if (characterRatio > 0.8) synergyScore -= 10;

      // Cost curve smoothness (needs early game, mid, late)
      if (costCurve['0-2'] < 10) synergyScore -= 15;
      if (costCurve['3-4'] < 10) synergyScore -= 15;

      synergyScore = Math.max(0, Math.min(100, synergyScore));

      let summaryText = 'เด็คสมดุลดี พร้อมลุย';
      if (synergyScore < 50) {
        summaryText = 'เด็คอาจต้องปรับปรุงสมดุลของการ์ดหรือการใช้หมึก';
      } else if (synergyScore < 80) {
        summaryText = 'เด็คค่อนข้างดี แต่อาจเพิ่มการ์ดตัวละครหรือปรับ Cost Curve';
      }

      const analysis = {
        totalCards,
        costCurve,
        inkDistribution,
        characterRatio,
        avgCost,
        synergyScore,
        summaryText,
        analyzedAt: new Date().toISOString()
      };

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
