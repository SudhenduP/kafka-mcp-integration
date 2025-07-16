# Kafka MCP Integration

An AI-powered Kafka monitoring and management system using the Model Context Protocol (MCP). This project enables natural language interactions with Apache Kafka clusters through AI assistants like Claude Desktop.

## 🎯 What This Does

Transform complex Kafka operations into simple conversations:

- **"How is my orders topic doing?"** → Get comprehensive health analysis
- **"Are there any consumer lag issues?"** → Receive intelligent lag analysis with recommendations
- **"Show me recent payment failures"** → Inspect and analyze message patterns
- **"Should I scale my Kafka cluster?"** → Get performance insights and scaling advice

## 🏗️ Architecture

```
┌─────────────────┐    MCP Protocol    ┌─────────────────┐    Kafka APIs    ┌─────────────────┐
│   AI Assistant  │◄─────────────────►│  Kafka MCP      │◄────────────────►│  Kafka Cluster  │
│                 │   (stdio/HTTP)     │    Server       │  (Admin/Client)  │                 │
│ - Claude        │                    │                 │                  │ - Brokers       │
│ - Cursor        │                    │ - Tool Handlers │                  │ - Topics        │
│ - Custom Apps   │                    │ - Kafka Clients │                  │ - Partitions    │
└─────────────────┘                    │ - Data Analysis │                  │ - Consumer Grps │
                                       └─────────────────┘                  └─────────────────┘
```

## 📁 Project Structure

```
kafka-mcp-integration/
├── docker/                     # Docker configurations
│   ├── docker-compose.yml      # Kafka cluster setup
│   └── kafka-setup.sh          # Kafka initialization
├── mcp-server/                 # MCP server implementation
│   ├── src/
│   │   ├── index.ts            # Server entry point
│   │   ├── server.ts           # MCP server logic
│   │   ├── tools/              # Kafka analysis tools
│   │   ├── kafka/              # Kafka client wrappers
│   │   └── types/              # TypeScript definitions
│   ├── package.json
│   └── tsconfig.json
├── mcp-client/                 # MCP client for testing
│   ├── src/
│   │   ├── index.ts            # Client entry point
│   │   ├── client.ts           # MCP client implementation
│   │   └── demo.ts             # Demo scenarios
│   ├── package.json
│   └── tsconfig.json
├── config/                     # Configuration files
│   ├── kafka.json              # Kafka settings
│   └── mcp-server.json         # MCP server config
├── scripts/                    # Automation scripts
│   ├── setup.ps1               # Complete setup
│   ├── start-kafka.ps1         # Start Kafka cluster
│   ├── start-mcp-server.ps1    # Start MCP server
│   └── demo.ps1                # Run demo scenarios
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (running)
- **Node.js** (v16 or higher)
- **Claude Desktop** (for AI integration)

### 1. Setup & Build

```powershell
# Clone and navigate to project
git clone <repository-url>
cd kafka-mcp-integration

# Clean build everything
cd mcp-server
Remove-Item -Recurse -Force dist, node_modules -ErrorAction SilentlyContinue
npm install && npm run build

cd ../mcp-client  
Remove-Item -Recurse -Force dist, node_modules -ErrorAction SilentlyContinue
npm install && npm run build

cd ..
```

### 2. Start Infrastructure

```powershell
# Run setup script
./scripts/setup.ps1

# Start Kafka cluster
./scripts/start-kafka.ps1

# Wait for Kafka to be ready
Start-Sleep -Seconds 45
```

### 3. Create Test Data

```bash
# Create sample topics
docker exec kafka kafka-topics --create --topic orders --bootstrap-server localhost:29092 --partitions 3 --replication-factor 1
docker exec kafka kafka-topics --create --topic payments --bootstrap-server localhost:29092 --partitions 2 --replication-factor 1

# Produce sample messages
docker exec kafka bash -c 'echo "{\"order_id\":\"order_001\",\"amount\":99.99,\"status\":\"completed\"}" | kafka-console-producer --topic orders --bootstrap-server localhost:29092'
```

### 4. Test MCP Tools

```powershell
# Start MCP server
./scripts/start-mcp-server.ps1

# In new terminal, test client
cd mcp-client
node dist/index.js

# Try commands:
# check_topic_health {"topic": "orders"}
# analyze_consumer_lag {"topic": "orders"}
# inspect_messages {"topic": "orders", "limit": 5}
# analyze_broker_performance {}
```

### 5. Claude Desktop Integration

Create `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kafka-mcp": {
      "command": "node",
      "args": [
        "C:\\path\\to\\kafka-mcp-integration\\mcp-server\\dist\\index.js"
      ],
      "env": {
        "KAFKA_BROKERS": "localhost:29092",
        "NODE_ENV": "production"
      }
    }
  }
}
```

Restart Claude Desktop and start chatting with your Kafka cluster!

## 🛠️ Available Tools

### `analyze_consumer_lag`
Analyzes consumer group lag across topics and partitions.

**Usage:** `{"topic": "orders"}`

**Returns:** Detailed lag analysis with recommendations

### `check_topic_health`
Comprehensive health check for Kafka topics.

**Usage:** `{"topic": "orders"}`

**Returns:** Partition health, replication status, and issues

### `inspect_messages`
Samples and analyzes recent messages from topics.

**Usage:** `{"topic": "orders", "limit": 10}`

**Returns:** Recent messages with metadata and patterns

### `analyze_broker_performance`
Monitors broker metrics and cluster performance.

**Usage:** `{}`

**Returns:** Broker status, metrics, and performance insights

## 🎮 Demo Scenarios

### Basic Health Check
```
You: "How is my Kafka cluster doing?"
Claude: "Let me check your cluster health..."
[Runs multiple tools and provides comprehensive analysis]
```

### Consumer Lag Investigation
```
You: "My order processing seems slow, what's wrong?"
Claude: "I'll analyze your consumer lag..."
[Identifies bottlenecks and suggests optimizations]
```

### Message Pattern Analysis
```
You: "Are there any suspicious payment patterns?"
Claude: "Let me examine recent payment messages..."
[Analyzes messages and identifies anomalies]
```

## 🔧 Configuration

### Kafka Connection
Edit `config/kafka.json`:
```json
{
  "brokers": ["localhost:29092"],
  "clientId": "kafka-mcp-server",
  "connectionTimeout": 3000
}
```

### MCP Server Settings
Edit `config/mcp-server.json`:
```json
{
  "transport": "stdio",
  "tools": {
    "enabled": ["analyze_consumer_lag", "check_topic_health", "inspect_messages", "analyze_broker_performance"]
  }
}
```

## 🐛 Troubleshooting

### MCP Server Times Out
```powershell
# Check compilation
cd mcp-server
npx tsc --noEmit

# Verify Kafka connection
docker exec kafka kafka-topics --list --bootstrap-server localhost:29092
```

### Port Conflicts
```bash
# Check port usage
netstat -an | findstr ":29092"
netstat -an | findstr ":9092"
```

### Claude Desktop Connection Issues
1. Verify config file location: `%APPDATA%\Claude\claude_desktop_config.json`
2. Check file paths are absolute and correct
3. Restart Claude Desktop after config changes
4. Look for MCP connection indicator in Claude Desktop

## 🧹 Cleanup

```powershell
# Stop all services
taskkill /F /IM node.exe

# Clean Docker
cd docker
docker-compose down --volumes --remove-orphans
docker system prune -f

# Clean builds
Remove-Item -Recurse -Force mcp-server\dist, mcp-client\dist -ErrorAction SilentlyContinue
```

## 📝 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Apache Kafka](https://kafka.apache.org/)
- [Claude Desktop](https://claude.ai/download)
- [KafkaJS](https://kafka.js.org/)


---

**Transform your Kafka operations with the power of AI! 🚀**
