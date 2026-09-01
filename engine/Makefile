.PHONY: install dev lint test run db-upgrade db-downgrade docker-build docker-run

install:
	pip install -e ".[dev]"

dev:
	python -m src.main

lint:
	ruff check src/

test:
	pytest tests/ -v

run:
	python -m src.main

db-upgrade:
	alembic upgrade head

db-downgrade:
	alembic downgrade -1

docker-build:
	docker build -t xmbot-engine .

docker-run:
	docker run -d --name xmbot-engine --env-file .env -p 8080:8080 xmbot-engine
