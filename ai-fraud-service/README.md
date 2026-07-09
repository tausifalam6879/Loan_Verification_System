# FinTrack AI/Data Science Service

Standalone Python FastAPI service for ML-backed fintech features.

It now contains:

- Loan fraud-risk scoring endpoint.
- Expense category prediction using TF-IDF + Logistic Regression.
- Expense insight endpoint for forecasting, anomaly detection, and saving recommendations.
- Labeled training data in `data/expense_training_data.csv`.
- Saved model generation in `models/expense_category_model.joblib` after first startup.

## Run

From project root:

```bat
start-ai-service.bat
```

Or manually:

```bash
cd ai-fraud-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Health Check

```http
GET http://localhost:8000/health
```

## Expense Category Prediction

```http
POST http://localhost:8000/expense-category
```

Example:

```json
{
  "description": "Zomato dinner"
}
```

Response:

```json
{
  "category": "Food",
  "confidence": 0.73,
  "model_version": "tfidf-logreg-v1",
  "top_predictions": [
    { "category": "Food", "confidence": 0.73 }
  ]
}
```

Spring Boot proxy endpoint:

```http
POST http://localhost:8081/api/ai/expenses/category
```

## Expense Insights

```http
POST http://localhost:8000/expense-insights
```

The response includes expected next-month spending, top category, unusual expenses, and saving recommendations.

## Fraud Score Endpoint

```http
POST http://localhost:8000/fraud-score
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
