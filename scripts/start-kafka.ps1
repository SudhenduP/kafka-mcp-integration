# Start Kafka Cluster Script
Write-Host "Starting Kafka cluster with Docker..." -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker/docker-compose.yml down

# Start Kafka cluster
Write-Host "Starting Kafka cluster..." -ForegroundColor Yellow
docker-compose -f docker/docker-compose.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start Kafka cluster" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host "Waiting for Kafka to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if Kafka is running
$kafkaRunning = docker ps --filter "name=kafka" --filter "status=running" --quiet
if (-not $kafkaRunning) {
    Write-Host "Kafka container is not running" -ForegroundColor Red
    exit 1
}

# Setup topics and sample data
Write-Host "Setting up topics and sample data..." -ForegroundColor Yellow

# Create topics
docker exec kafka kafka-topics --create --topic orders --bootstrap-server localhost:29092 --partitions 3 --replication-factor 1 --if-not-exists
docker exec kafka kafka-topics --create --topic user-events --bootstrap-server localhost:29092 --partitions 6 --replication-factor 1 --if-not-exists
docker exec kafka kafka-topics --create --topic payment-events --bootstrap-server localhost:29092 --partitions 4 --replication-factor 1 --if-not-exists
docker exec kafka kafka-topics --create --topic notifications --bootstrap-server localhost:29092 --partitions 2 --replication-factor 1 --if-not-exists

# Produce sample data
$order1 = '{"order_id": "order_001", "customer_id": "cust_123", "amount": 99.99, "timestamp": "2025-07-15T10:30:00Z"}'
$order2 = '{"order_id": "order_002", "customer_id": "cust_456", "amount": 149.50, "timestamp": "2025-07-15T10:31:00Z"}'
$order3 = '{"order_id": "order_003", "customer_id": "cust_789", "amount": 75.25, "timestamp": "2025-07-15T10:32:00Z"}'

echo $order1 | docker exec -i kafka kafka-console-producer --topic orders --bootstrap-server localhost:29092
echo $order2 | docker exec -i kafka kafka-console-producer --topic orders --bootstrap-server localhost:29092
echo $order3 | docker exec -i kafka kafka-console-producer --topic orders --bootstrap-server localhost:29092

$event1 = '{"event_type": "login", "user_id": "user_123", "ip_address": "192.168.1.100", "timestamp": "2025-07-15T10:30:45Z"}'
$event2 = '{"event_type": "page_view", "user_id": "user_456", "page": "/products", "timestamp": "2025-07-15T10:31:15Z"}'

echo $event1 | docker exec -i kafka kafka-console-producer --topic user-events --bootstrap-server localhost:29092
echo $event2 | docker exec -i kafka kafka-console-producer --topic user-events --bootstrap-server localhost:29092

Write-Host "Kafka cluster started successfully!" -ForegroundColor Green
Write-Host "Services available at:" -ForegroundColor Cyan
Write-Host "   Kafka Broker: localhost:9092" -ForegroundColor White
Write-Host "   Kafka UI: http://localhost:8080" -ForegroundColor White
Write-Host "   Schema Registry: http://localhost:8081" -ForegroundColor White
Write-Host "   Zookeeper: localhost:2181" -ForegroundColor White

# Show running containers
Write-Host "Running containers:" -ForegroundColor Cyan
docker ps --filter "name=kafka" --filter "name=zookeeper" --filter "name=schema-registry" --filter "name=kafka-ui"