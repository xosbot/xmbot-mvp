.PHONY: install dev lint test run docker-build docker-run

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

docker-build:
	docker build -t xmbot-engine .

docker-run:
	docker run -d --name xmbot-engine --env-file .env -p 8080:8080 xmbot-engine
