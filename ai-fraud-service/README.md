# FinTrack AI/Data Science Service

Standalone Python FastAPI service for ML-backed fintech features.

It now contains:

- Loan fraud-risk scoring endpoint.
- Expense category prediction using TF-IDF + Logistic Regression.
- Expense insight endpoint for forecasting, anomaly detection, and saving recommendations.
- Labeled training data in `data/expense_training_data.csv`.
- Saved model generation in `models/expense_category_model.joblib` after first startup.
- Global index and stock history through `yfinance`.
- Chronological Logistic Regression next-session direction model with a holdout accuracy metric.
- Technical indicators, estimated price range, and transparent headline sentiment.
- Read-only market research agent that executes market tools and uses local Ollama for explanation.

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

## Tests

From the project root:

```bash
python -m pytest ai-fraud-service/tests -q
```

The deterministic test suite covers service health, low- and high-risk fraud decisions, empty expense history, and expense insight generation without calling an external market or LLM provider.

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

## Global Market Intelligence

```http
GET  http://localhost:8000/market/overview
GET  http://localhost:8000/market/analysis?symbol=^NSEI
GET  http://localhost:8000/market/news?symbol=AAPL
GET  http://localhost:8000/market/factors
GET  http://localhost:8000/market/breadth
GET  http://localhost:8000/market/company?symbol=RELIANCE.NS
GET  http://localhost:8000/market/news-feed
POST http://localhost:8000/market/agent
```

The analysis endpoint trains on rolling returns, moving-average ratios, volatility, volume change, and RSI. It uses an 80/20 chronological split, reports holdout accuracy, calibrates weak models toward 50%, and adds a capped transparent overlay from gold, crude, USD/INR, US yields, VIX and global equity sentiment. It returns a probability and volatility-based range rather than a guaranteed price.

Market data comes from Yahoo Finance through `yfinance`, is intended for research/demo use, and can be delayed. The default cache is 120 seconds. Passing `refresh=true` clears the market cache before fetching current upstream values. The breadth endpoint covers the named representative liquid watchlist, not every NSE security.

The market agent runs read-only data tools before sending their compact output to the configured backend LLM. React never calls an LLM directly. Supported providers are `ollama`, `gemini`, `openai`, and `openai-compatible`.

```powershell
ollama pull llama3.2:3b
$env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
$env:LLM_MODEL="llama3.2:3b"
```

Ollama is optional for numeric analytics. If it is offline, the endpoint returns a deterministic tool summary and marks `llmStatus` as `offline`.

For a hosted Gemini explanation layer, configure only the Python backend:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-server-side-key
LLM_MODEL=gemini-3.5-flash
LLM_TIMEOUT_MS=15000
```

Market quotes, factors, breadth, company research and the Scikit-learn outlook do not depend on the LLM and continue to use verified tool output if the configured provider is unavailable.
