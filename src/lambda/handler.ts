import { APIGatewayProxyHandler } from 'aws-lambda';
import { processMessage } from '../mirror-engine/mirror-core';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { input, history } = JSON.parse(event.body || '{}');
    console.log("Received input:", JSON.stringify(input));
    const result = await processMessage(input, history || []);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("Error occurred:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (err as Error).message }),
    };
  }
};
