.DEFAULT_GOAL := help
SHELL         := /bin/bash
COMPOSE       := docker compose

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

# ── Dev ────────────────────────────────────────────────────────
.PHONY: dev
dev: ## Start dev server (nodemon)
	npm run start

.PHONY: test
test: ## Run tests (Jest)
	npm test

.PHONY: lint
lint: ## Lint code
	npm run lint

# ── Docker ─────────────────────────────────────────────────────
.PHONY: build
build: check-env ## Build Docker image
	$(COMPOSE) build

.PHONY: up
up: check-env ## Start all services (mongodb + backend)
	$(COMPOSE) up -d

.PHONY: up-backend
up-backend: check-env ## Start backend only (uses external MongoDB via MONGODB_URL)
	$(COMPOSE) up -d --no-deps backend

.PHONY: down
down: ## Stop and remove containers (data preserved)
	$(COMPOSE) down

.PHONY: rebuild
rebuild: check-env ## Rebuild image and restart
	$(COMPOSE) up -d --build

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

# ── Danger ─────────────────────────────────────────────────────
.PHONY: down-volumes
down-volumes: ## ⚠ Stop containers AND wipe MongoDB data (removes named volume)
	$(COMPOSE) down -v
	@echo "MongoDB data wiped"
