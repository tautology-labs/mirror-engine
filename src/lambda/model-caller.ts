import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { MirrorInput } from "./mirror-core";
import { resolveS3KeyInput, uploadToS3 } from "./s3-client";

const secretsClient = new SecretsManagerClient({ region: "us-east-1" });
const ssmKeyName = "MirrorOpenAIKey";
async function getOpenAIKey(): Promise<string> {
  const command = new GetSecretValueCommand({ SecretId: ssmKeyName });
  const response = await secretsClient.send(command);
  return response.SecretString || '';
}

export async function callLLM(input: MirrorInput): Promise<{ response: string }> {
  const apiKey = await getOpenAIKey();

  const openai = new OpenAI({ apiKey });

  const messages: ChatCompletionMessageParam[] = [];
  if (input.systemPrompt && input.systemPrompt.trim() !== "") {
    messages.push({
      role: "system",
      content: input.systemPrompt
    });
  }
  messages.push({
    role: "user",
    content: input.userPrompt
  });

  const payload = {
    model: input.model, 
    messages: messages,
    temperature: 0.7
  }
  console.log("🧠 Calling OpenAI API with payload:");
  console.log(JSON.stringify(payload, null, 2)); // pretty-print for easier debug
  
  const now = new Date();
  const log = {
    timestamp: now.toISOString(),
    epoch: now.getTime(),
    payload: payload,
    source: "mirror-engine-lambda-v1"
  };
  // write input to s3
  await uploadToS3(resolveS3KeyInput(input.model, input.tone), JSON.stringify(log));

  const chat = await openai.chat.completions.create(payload);

  return {
    response: chat.choices[0]?.message?.content ?? "⚠️ No response"
  };
}
