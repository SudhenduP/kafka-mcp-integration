import { KafkaMCPClient } from './client.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runDemo(): Promise<void> {
  const serverPath = join(__dirname, '../../mcp-server/dist/index.js');
  const client = new KafkaMCPClient(serverPath);

  try {
    await client.connect();

    console.log('🔍 Listing available tools...');
    const tools = await client.listTools();
    console.log('Available tools:', tools.tools.map((t: any) => t.name).join(', '));

    console.log('\n📊 Analyzing consumer lag...');
    const lagAnalysis = await client.callTool('analyze_consumer_lag');
    console.log('Consumer Lag Analysis:', JSON.stringify(lagAnalysis, null, 2));

    console.log('\n🏥 Checking topic health...');
    const healthCheck = await client.callTool('check_topic_health');
    console.log('Topic Health Check:', JSON.stringify(healthCheck, null, 2));

    console.log('\n🔍 Inspecting messages from orders topic...');
    const messageInspection = await client.callTool('inspect_messages', {
      topic: 'orders',
      limit: 5
    });
    console.log('Message Inspection:', JSON.stringify(messageInspection, null, 2));

    console.log('\n⚡ Analyzing broker performance...');
    const brokerAnalysis = await client.callTool('analyze_broker_performance');
    console.log('Broker Performance:', JSON.stringify(brokerAnalysis, null, 2));

  } catch (error) {
    console.error('Demo failed:', error);
  } finally {
    await client.disconnect();
  }
}

runDemo().catch(console.error);