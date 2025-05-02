import OpenAI from "openai";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const secretsClient = new SecretsManagerClient({ region: "us-east-1" });
const ssmKeyName = "MirrorOpenAIKey";
async function getOpenAIKey(): Promise<string> {
  const command = new GetSecretValueCommand({ SecretId: ssmKeyName });
  const response = await secretsClient.send(command);
  return response.SecretString || '';
}

export async function callLLM(input: string): Promise<string> {
  const apiKey = await getOpenAIKey();

  const openai = new OpenAI({ apiKey });

  const chat = await openai.chat.completions.create({
    model: "gpt-4", // or "gpt-3.5-turbo"
    messages: [
      {
        role: "system",
        content: "Respond to the following user inputs as if you are helping them become more true to themselves. Reflect, don’t flatten."
      },
      {
        role: "user",
        content: input
      }
    ],
    temperature: 0.7
  });

  return chat.choices[0]?.message?.content ?? "⚠️ No response";
}
