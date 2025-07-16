import { KafkaMCPClient } from './client.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main(): Promise<void> {
  const serverPath = join(__dirname, '../../mcp-server/dist/index.js');
  const client = new KafkaMCPClient(serverPath);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    await client.connect();
    
    const tools = await client.listTools();
    console.log('Available tools:', tools.tools.map((t: any) => t.name).join(', '));

    const askQuestion = (question: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(question, resolve);
      });
    };

    while (true) {
      const toolName = await askQuestion('\nEnter tool name (or "quit" to exit): ');
      
      if (toolName.toLowerCase() === 'quit') {
        break;
      }

      const argsInput = await askQuestion('Enter arguments as JSON (or press Enter for none): ');
      let args = {};
      
      if (argsInput.trim()) {
        try {
          args = JSON.parse(argsInput);
        } catch (error) {
          console.log('Invalid JSON, using empty arguments');
        }
      }

      try {
        const result = await client.callTool(toolName, args);
        console.log('\nResult:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('Error calling tool:', error);
      }
    }

  } catch (error) {
    console.error('Client failed:', error);
  } finally {
    rl.close();
    await client.disconnect();
  }
}

main().catch(console.error);