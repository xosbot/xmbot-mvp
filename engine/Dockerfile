FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/
COPY alembic.ini .
COPY migrations/ migrations/
COPY start.sh .
RUN chmod +x start.sh

ENV PYTHONUNBUFFERED=1
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT ["./start.sh"]
