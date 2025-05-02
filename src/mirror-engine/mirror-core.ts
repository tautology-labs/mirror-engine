export interface MirrorResult {
  response: string;
  recursionScore: number;
  compressionScore: number;
  flags: string[];
}

import { callLLM } from '../lambda/model-caller';

export interface FlagCheckConfig {
  id: string;
  fn: (input: string, history: string[]) => number;
  threshold: number;
  operator: '>' | '>=' | '<' | '<=' | '===';
}

const customFlagChecks: FlagCheckConfig[] = [
  {
    id: 'loop-detected',
    fn: detectRecursion,
    threshold: 0.7,
    operator: '>'
  },
  {
    id: 'high-density',
    fn: (input: string) => scoreCompression(input),
    threshold: 0.75,
    operator: '>'
  },
  {
    id: 'spiraling',
    fn: detectSpiral,
    threshold: 0.6,
    operator: '>'
  },
  {
    id: 'low-self-worth',
    fn: detectLowSelfWorth,
    threshold: 0.1,
    operator: '>'
  },
  {
    id: 'excessive-self-worth',
    fn: detectHighSelfWorth,
    threshold: 0.1,
    operator: '>'
  }
];

export function registerFlagCheck(config: FlagCheckConfig) {
  customFlagChecks.push(config);
}

export async function processMessage(input: string, history: string[]): Promise<MirrorResult> {
  const recursionScore = detectRecursion(input, history);
  const compressionScore = scoreCompression(input);
  const flags: string[] = [];

  for (const { id, fn, threshold, operator } of customFlagChecks) {
    const score = fn(input, history);
    if (evaluate(score, threshold, operator)) flags.push(id);
  }

  const modelResponse = await callLLM(input);

  return {
    response: modelResponse,
    recursionScore,
    compressionScore,
    flags
  };
}

function evaluate(value: number, threshold: number, operator: string): boolean {
  switch (operator) {
    case '>': return value > threshold;
    case '>=': return value >= threshold;
    case '<': return value < threshold;
    case '<=': return value <= threshold;
    case '===': return value === threshold;
    default: return false;
  }
}

const WORD_THRESHOLD = 5;

function detectRecursion(current: string | null, history: string[] | null): number {
  if (!current || !Array.isArray(history) || current.split(" ").length < WORD_THRESHOLD) return 0;
  let matches = 0;
  for (const past of history.slice(-5)) {
    const sim = similarity(current, past);
    if (sim > 0.85) matches++;
  }
  return matches / Math.min(history.length, 5);
}

function detectSpiral(current: string | null, history: string[] | null): number {
  if (!current || !Array.isArray(history) || current.split(" ").length < WORD_THRESHOLD) return 0;
  const recent = history.slice(-3);
  const avgSim = recent
    .map(p => similarity(current, p))
    .reduce((a, b) => a + b, 0) / Math.max(recent.length, 1);
  return avgSim;
}

function detectLowSelfWorth(input: string | null): number {
  if (!input) return 0;
  const patterns = [/i'm not enough/i, /i hate myself/i, /i don't matter/i, /i'm worthless/i, /i suck/i];
  return patterns.reduce((score, regex) => score + (regex.test(input) ? 1 : 0), 0) / patterns.length;
}

function detectHighSelfWorth(input: string | null): number {
  if (!input) return 0;
  const patterns = [/i'm better than/i, /they're all idiots/i, /i'm perfect/i, /i know everything/i];
  return patterns.reduce((score, regex) => score + (regex.test(input) ? 1 : 0), 0) / patterns.length;
}

function scoreCompression(text: string | null): number {
  if (!text) return 0;
  if (text.split(" ").length < WORD_THRESHOLD) return 0;
  const words = text.split(" ");
  const unique = new Set(words);
  return unique.size / Math.max(words.length, 1);
}

function similarity(a: string | null, b: string | null): number {
  if (!a || !b) return 0;
  const aWords = a.split(" ");
  const bWords = new Set(b.split(" "));
  let matches = 0;
  for (const word of aWords) if (bWords.has(word)) matches++;
  return matches / Math.max(aWords.length, 1);
}

