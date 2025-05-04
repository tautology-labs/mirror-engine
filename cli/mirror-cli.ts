import axios from 'axios';
import readline from 'readline-sync';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Replace this with your actual deployed endpoint
const API_URL = 'https://cfxk4u7u4l.execute-api.us-east-1.amazonaws.com/prod/';

let history: string[] = [];
const saveResponses = true; // toggle to false if you don’t want file output
const outDir = './mirror-logs';

if (saveResponses && !fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

async function main() {
  console.log(chalk.cyan('\nMirror Engine Alpha – CLI Therapist'));
  console.log(chalk.gray('Type your thoughts. Type "exit" to quit.\n'));

  while (true) {
    const input = readline.question(chalk.green('You: '));
    if (['exit', 'quit', 'bye'].includes(input.trim().toLowerCase())) break;

    try {
      const response = await axios.post(API_URL, {
        input,
        history,
      });

      const data = response.data;
      history.push(input);
      history = history.slice(-10); // maintain window

      if (!data?.results || !Array.isArray(data.results)) {
        console.log(chalk.red('⚠️ Unexpected response format from Lambda.'));
        continue;
      }

      console.log('\n🪞 ' + chalk.yellow('Mirror Responses:'));

      const timestamp = Date.now();
      const logFile = path.join(outDir, `mirror-${timestamp}.json`);
      if (saveResponses) {
        fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
        console.log(chalk.gray(`📝 Saved full results to ${logFile}`));
      }

      for (const result of data.results) {
        const { model, tone, response: message } = result;
        console.log(chalk.gray(`\n[${model} | ${tone}]`));
        console.log(message);
      }

      console.log(); // spacing

    } catch (err) {
      console.error(chalk.red('❌ Error:'), err instanceof Error ? err.message : err);
    }
  }

  console.log(chalk.gray('\nMirror Engine session ended.\n'));
}

main();