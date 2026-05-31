.PHONY: run seed migrate build clean

DB_HOST ?= localhost
DB_PORT ?= 5432
DB_USER ?= postgres
DB_PASSWORD ?= postgres
DB_NAME ?= floor_settlement
DB_SSLMODE ?= disable
JWT_SECRET ?= change-me-in-production-32chars
SERVER_PORT ?= 8080

build:
	cd cmd/server && go build -o ../../bin/server .

run: build
	DB_HOST=$(DB_HOST) DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) \
	DB_NAME=$(DB_NAME) DB_SSLMODE=$(DB_SSLMODE) JWT_SECRET=$(JWT_SECRET) SERVER_PORT=$(SERVER_PORT) \
	./bin/server

seed: build
	DB_HOST=$(DB_HOST) DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) \
	DB_NAME=$(DB_NAME) DB_SSLMODE=$(DB_SSLMODE) JWT_SECRET=$(JWT_SECRET) SERVER_PORT=$(SERVER_PORT) \
	./bin/server seed

migrate:
	@echo "migrations run automatically on startup"

clean:
	rm -rf bin/

deps:
	cd /Users/zhangliu/Documents/private/model-test/trae-test-3/backend && go mod tidy

dev:
	DB_HOST=$(DB_HOST) DB_PORT=$(DB_PORT) DB_USER=$(DB_USER) DB_PASSWORD=$(DB_PASSWORD) \
	DB_NAME=$(DB_NAME) DB_SSLMODE=$(DB_SSLMODE) JWT_SECRET=$(JWT_SECRET) SERVER_PORT=$(SERVER_PORT) \
	go run cmd/server/main.go
