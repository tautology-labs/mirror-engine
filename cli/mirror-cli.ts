import axios from 'axios';
import readline from 'readline-sync';
import chalk from 'chalk';

// Replace this with your actual deployed endpoint
const API_URL = 'https://cfxk4u7u4l.execute-api.us-east-1.amazonaws.com/prod/';

let history: string[] = [];

async function main() {
  console.log('\x1b[36m%s\x1b[0m', '\nMirror Engine Alpha – CLI Therapist');
  console.log('\x1b[90m%s\x1b[0m', 'Type your thoughts. Type "exit" to quit.\n');

  while (true) {
    const input = readline.question('\x1b[32mYou: \x1b[0m');
    if (['exit', 'quit', 'bye'].includes(input.trim().toLowerCase())) break;

    try {
      const response = await axios.post(API_URL, {
        input,
        history
      });

      const data = response.data;
      history.push(input);
      history = history.slice(-10);

      console.log('\n\x1b[33m%s\x1b[0m', '🪞 Mirror Response:');
      console.log(data.response);
      console.log('\x1b[90m%s\x1b[0m', `\n📊 Recursion: ${data.recursionScore.toFixed(2)} | Compression: ${data.compressionScore.toFixed(2)}`);

      if (data.flags.length > 0) {
        console.log('\x1b[91m%s\x1b[0m', `🚩 Flags: ${data.flags.join(', ')}`);
      } else {
        console.log('\x1b[32m%s\x1b[0m', '✅ No flags.');
      }

      console.log();
    } catch (err) {
      console.error('\x1b[91mError:\x1b[0m', err instanceof Error ? err.message : err);
    }
  }

  console.log('\x1b[90m%s\x1b[0m', '\nMirror Engine session ended.\n');
}

main();
