.DEFAULT_GOAL := help
SHELL         := /bin/bash
COMPOSE       := docker compose
COMPOSE_PROD  := docker compose -f docker-compose.prod.yml

.PHONY: help
help: ## Show available commands
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
	      /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' \
	      $(MAKEFILE_LIST)

# ── Setup ──────────────────────────────────────────────────────
.PHONY: setup
setup: ## First-time setup: copy .env.example → .env
	@cp -n .env.example .env \
	  && echo "✓ .env created — fill in the values, then: make up" \
	  || echo "ℹ .env already exists"

.PHONY: install
install: ## Install npm dependencies
	npm install

.PHONY: check-env
check-env: ## Fail early if .env is missing
	@if [ ! -f .env ]; then \
		echo "✗ .env is missing."; \
		echo "Run: make setup"; \
		echo "Then review the generated .env values before starting containers."; \
		exit 1; \
	fi

# ── Local (no Docker) ──────────────────────────────────────────
.PHONY: dev
dev: ## Run the backend directly on the host (nodemon)
	npm run start

.PHONY: test
test: ## Run tests (Jest)
	npm test

.PHONY: lint
lint: ## Lint code
	npm run lint

# ── Docker (dev — default) ─────────────────────────────────────
.PHONY: up
up: check-env ## Start dev stack: mongo + backend with live-reload (code bind-mounted)
	$(COMPOSE) up -d

.PHONY: up-backend
up-backend: check-env ## Start backend only (uses external MongoDB via MONGODB_URL)
	$(COMPOSE) up -d --no-deps backend

.PHONY: down
down: ## Stop and remove containers (data preserved)
	$(COMPOSE) down

.PHONY: restart
restart: ## Restart containers
	$(COMPOSE) restart

.PHONY: ps
ps: ## Show container status
	$(COMPOSE) ps

.PHONY: logs
logs: ## Tail all logs. Optional: make logs s=backend
	$(eval s ?= )
	$(COMPOSE) logs -f --tail=100 $(s)

.PHONY: shell
shell: ## Shell inside backend container
	$(COMPOSE) exec backend sh

.PHONY: mongo
mongo: ## MongoDB shell (mongosh)
	$(COMPOSE) exec mongodb mongosh spacetostudy

# ── Migrations (migrate-mongo, run inside backend container) ───
.PHONY: migrate-status
migrate-status: ## List migrations and their state
	$(COMPOSE) exec backend npm run migrate:status

.PHONY: migrate-up
migrate-up: ## Apply all pending migrations
	$(COMPOSE) exec backend npm run migrate:up

.PHONY: migrate-down
migrate-down: ## Roll back the last applied migration
	$(COMPOSE) exec backend npm run migrate:down

.PHONY: migrate-create
migrate-create: ## Scaffold a new migration. Usage: make migrate-create name=add-foo
	@if [ -z "$(name)" ]; then \
		echo "✗ name is required. Usage: make migrate-create name=add-foo"; \
		exit 1; \
	fi
	$(COMPOSE) exec backend npm run migrate:create $(name)

# ── Docker (prod) ──────────────────────────────────────────────
.PHONY: prod-build
prod-build: check-env ## Build production image (Dockerfile)
	$(COMPOSE_PROD) build

.PHONY: prod-up
prod-up: check-env ## Start production stack (built image)
	$(COMPOSE_PROD) up -d --build

.PHONY: prod-down
prod-down: ## Stop and remove production containers
	$(COMPOSE_PROD) down

# ── Deprecated aliases (kept for backward compatibility) ───────
.PHONY: build rebuild
build: prod-build  ## Deprecated: use prod-build
rebuild: prod-up   ## Deprecated: use prod-up

# ── Danger ─────────────────────────────────────────────────────
.PHONY: down-volumes
down-volumes: ## ⚠ Stop containers AND wipe MongoDB data (removes named volume)
	$(COMPOSE) down -v
	@echo "MongoDB data wiped"
