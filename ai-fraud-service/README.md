# AI Fraud Detection Service

This is a standalone Python FastAPI service for the loan aggregator module.

It is intentionally separate from the Spring Boot backend so the existing expense tracker and MySQL setup remain unchanged.

## Run

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Endpoint

```http
POST /fraud-score
```

The React loan UI currently mirrors this risk logic locally for demo use. In the next backend step, Spring Boot can call this Python service before saving a real loan application.
