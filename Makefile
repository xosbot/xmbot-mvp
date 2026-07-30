.PHONY: up down build logs psql db-push seed dev-engine dev-web

# ─── Production ──────────────────────────────────────────────────────────────

up:
	docker compose up -d --build

down:
	docker compose down

build:
	docker compose build

logs:
	docker compose logs -f

psql:
	docker compose exec postgres psql -U xmbot -d xmbot

# ─── Database ────────────────────────────────────────────────────────────────

db-push:
	docker compose exec -T web npx prisma db push

seed:
	docker compose exec -T web npx tsx prisma/seed.ts

# ─── Development (run without Docker) ────────────────────────────────────────

dev-engine:
	cd engine && .venv/bin/python -m src.main

dev-web:
	cd xmbot-mvp && npm run dev

# ─── Health ──────────────────────────────────────────────────────────────────

health:
	@echo "Engine:" && curl -s http://localhost:8080/health | python3 -m json.tool
	@echo "Web:" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
