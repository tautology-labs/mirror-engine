import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const secretsClient = new SecretsManagerClient({ region: "us-east-1" });
const ssmKeyName = "MirrorOpenAIKey";
async function getOpenAIKey(): Promise<string> {
  const command = new GetSecretValueCommand({ SecretId: ssmKeyName });
  const response = await secretsClient.send(command);
  return response.SecretString || '';
}

const ssm = new SSMClient({ region: process.env.AWS_REGION });
const overideKeyName = "/mirror-engine/enableOverride";
async function getOverrideFlag(): Promise<boolean> {
  try {
    const command = new GetParameterCommand({
      Name: overideKeyName,
      WithDecryption: false
    });
    const response = await ssm.send(command);
    const rawValue = response.Parameter?.Value;

    console.log(`SSM override flag value: ${rawValue}`);

    return rawValue === "true";
  } catch (e) {
    console.error("Error fetching override flag", e);
    return false; // fallback safe
  }
}

export async function callLLM(input: string): Promise<{ response: string; overrideUsed: boolean }> {
  const apiKey = await getOpenAIKey();

  const openai = new OpenAI({ apiKey });

  const messages: ChatCompletionMessageParam[] = [];
  const useOverride = await getOverrideFlag();
  if (useOverride) {
    messages.push({
      role: "system",
      content: "Respond to the following user inputs as if you are helping them become more true to themselves. Reflect, don’t flatten."
    });
  }
  messages.push({
    role: "user",
    content: input
  });

  const chat = await openai.chat.completions.create({
    model: "gpt-4", // or "gpt-3.5-turbo"
    messages: messages,
    temperature: 0.7
  });

  return {
    response: chat.choices[0]?.message?.content ?? "⚠️ No response",
    overrideUsed: useOverride
  };
}
