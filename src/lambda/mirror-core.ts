import pLimit from 'p-limit';

export interface MirrorInput {
  userPrompt: string;
  tone: string;
  systemPrompt: string;
  model: string;
}

export interface MirrorResult {
  response: string;
  tone: string;
  systemPrompt: string;
  model: string;
}

export interface MirrorResults {
  results: MirrorResult[]
}

import { callLLM } from './model-caller';
import { resolveS3KeyOutput, uploadToS3 } from './s3-client';

// const models = [
//   "gpt-4", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"
// ];

const models = [
  "gpt-4", "gpt-4o"
];

const systemPrompts: [label: string, prompt: string][] = [
  ['default', ''],
  ['mirror', "Respond to the following user inputs as if you are helping them become more true to themselves. Reflect, don’t flatten."],
  ['conform', "Help the user better conform to societal norms and expectations."],
  ['flatten', "Simplify emotional nuance and provide agreeable answers to avoid tension."],
];

const concurrencyLimit = 4; // adjust if needed
const limit = pLimit(concurrencyLimit);
export async function processMessage(input: string, history: string[]): Promise<MirrorResults> {
  const tasks: Promise<MirrorResult | null>[] = [];

  for (const [label, systemPrompt] of systemPrompts) {
    for (const model of models) {
      const mirrorInput: MirrorInput = {
        userPrompt: input,
        tone: label,
        systemPrompt,
        model,
      };

      const task = limit(async (): Promise<MirrorResult | null> => {
        try {
          const { response } = await callLLM(mirrorInput);
          const log = {
            timestamp: new Date().toISOString(),
            input: mirrorInput,
            response,
          };

          await uploadToS3(
            resolveS3KeyOutput(model, label),
            JSON.stringify(log, null, 2)
          );

          return {
            response,
            tone: label,
            systemPrompt,
            model,
          };
        } catch (err) {
          console.error(`Failed for model=${model}, tone=${label}`, err);
          return null; // optionally push an error response instead
        }
      });

      tasks.push(task);
    }
  }

  const settled = await Promise.allSettled(tasks);
  const results: MirrorResult[] = settled
    .filter(r => r.status === 'fulfilled' && r.value !== null)
    .map(r => (r as PromiseFulfilledResult<MirrorResult>).value);

  return { results };
}