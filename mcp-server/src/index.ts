import { KafkaMCPServer } from './server.js';
import { KafkaConfig } from './types/kafka.js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadConfig(): KafkaConfig {
  const configPath = join(__dirname, '../../config/kafka.json');
  
  if (existsSync(configPath)) {
    const configData = readFileSync(configPath, 'utf8');
    return JSON.parse(configData);
  }

  // Default configuration
  return {
    brokers: ['localhost:9092'],
    clientId: 'kafka-mcp-server',
    groupId: 'kafka-mcp-group'
  };
}

async function main(): Promise<void> {
  const config = loadConfig();
  const server = new KafkaMCPServer(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });

  await server.start();
}

main().catch(console.error);