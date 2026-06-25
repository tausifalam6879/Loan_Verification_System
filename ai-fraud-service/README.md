# AI Fraud Detection Service

Standalone Python FastAPI service for AI-style loan application fraud scoring.

The service is intentionally separate from the Spring Boot backend. It can be run independently during demos or connected from the backend in a later production integration.

## Run

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Health Check

```http
GET /health
```

## Fraud Score Endpoint

```http
POST /fraud-score
```

Example request:

```json
{
  "applicant_name": "Demo User",
  "credit_score": 650,
  "monthly_income": 50000,
  "requested_amount": 600000,
  "failed_attempts": 0,
  "identity_mismatch": false,
  "device_risk": "low",
  "ip_country_matches_kyc": true,
  "new_device": false
}
```

The response contains `risk_score`, `risk_level`, `decision`, and human-readable `reasons`.
