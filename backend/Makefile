.PHONY: dev build run test seed docker-up docker-down migrate

DB_URL = postgres://postgres:postgres@localhost:5432/cultural_store?sslmode=disable

dev:
	DATABASE_URL=$(DB_URL) SEED_DATA=true go run ./cmd/server

build:
	go build -o bin/server ./cmd/server

run: build
	DATABASE_URL=$(DB_URL) ./bin/server

test:
	go test ./... -v

seed:
	DATABASE_URL=$(DB_URL) SEED_DATA=true go run ./cmd/server

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

migrate:
	DATABASE_URL=$(DB_URL) go run -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest -path migrations -database $(DB_URL) up

deps:
	go mod tidy
