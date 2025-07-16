#!/bin/bash

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
sleep 30

# Create sample topics
echo "Creating sample topics..."

# Orders topic
kafka-topics --create --topic orders --bootstrap-server kafka:29092 --partitions 3 --replication-factor 1

# User events topic
kafka-topics --create --topic user-events --bootstrap-server kafka:29092 --partitions 6 --replication-factor 1

# Payment events topic
kafka-topics --create --topic payment-events --bootstrap-server kafka:29092 --partitions 4 --replication-factor 1

# Notifications topic
kafka-topics --create --topic notifications --bootstrap-server kafka:29092 --partitions 2 --replication-factor 1

echo "Topics created successfully!"

# List all topics
kafka-topics --list --bootstrap-server kafka:29092

# Produce some sample data
echo "Producing sample data..."

# Sample orders
echo '{"order_id": "order_001", "customer_id": "cust_123", "amount": 99.99, "timestamp": "2025-07-15T10:30:00Z"}' | kafka-console-producer --topic orders --bootstrap-server kafka:29092
echo '{"order_id": "order_002", "customer_id": "cust_456", "amount": 149.50, "timestamp": "2025-07-15T10:31:00Z"}' | kafka-console-producer --topic orders --bootstrap-server kafka:29092
echo '{"order_id": "order_003", "customer_id": "cust_789", "amount": 75.25, "timestamp": "2025-07-15T10:32:00Z"}' | kafka-console-producer --topic orders --bootstrap-server kafka:29092

# Sample user events
echo '{"event_type": "login", "user_id": "user_123", "ip_address": "192.168.1.100", "timestamp": "2025-07-15T10:30:45Z"}' | kafka-console-producer --topic user-events --bootstrap-server kafka:29092
echo '{"event_type": "page_view", "user_id": "user_456", "page": "/products", "timestamp": "2025-07-15T10:31:15Z"}' | kafka-console-producer --topic user-events --bootstrap-server kafka:29092

# Sample payment events
echo '{"payment_id": "pay_001", "order_id": "order_001", "status": "completed", "amount": 99.99, "timestamp": "2025-07-15T10:30:30Z"}' | kafka-console-producer --topic payment-events --bootstrap-server kafka:29092
echo '{"payment_id": "pay_002", "order_id": "order_002", "status": "pending", "amount": 149.50, "timestamp": "2025-07-15T10:31:30Z"}' | kafka-console-producer --topic payment-events --bootstrap-server kafka:29092

echo "Sample data produced successfully!"