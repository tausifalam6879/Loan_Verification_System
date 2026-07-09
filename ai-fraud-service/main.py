from pathlib import Path
from statistics import mean
from typing import Dict, List, Literal, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


app = FastAPI(
    title="FinTrack AI/Data Science Service",
    version="0.2.0",
    description="Python ML service for loan fraud scoring, expense categorization, forecasting, anomaly detection, and saving advice.",
)

BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "data" / "expense_training_data.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "expense_category_model.joblib"
MODEL_VERSION = "tfidf-logreg-v1"


class FraudRequest(BaseModel):
    applicant_name: str = Field(min_length=2)
    credit_score: int = Field(ge=300, le=900)
    monthly_income: float = Field(ge=0)
    requested_amount: float = Field(ge=0)
    failed_attempts: int = Field(ge=0, default=0)
    identity_mismatch: bool = False
    device_risk: Literal["low", "medium", "high"] = "low"
    ip_country_matches_kyc: bool = True
    new_device: bool = False


class FraudResponse(BaseModel):
    risk_score: int
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    decision: str
    reasons: List[str]


class ExpenseCategoryRequest(BaseModel):
    description: str = Field(min_length=2, examples=["Zomato dinner", "Uber ride", "Jio recharge"])


class PredictionScore(BaseModel):
    category: str
    confidence: float


class ExpenseCategoryResponse(BaseModel):
    category: str
    confidence: float
    model_version: str
    top_predictions: List[PredictionScore]


class ExpenseRecord(BaseModel):
    amount: float = Field(ge=0)
    category: str = "Other"
    description: str = ""
    date: Optional[str] = None


class ExpenseInsightsRequest(BaseModel):
    total_income: float = Field(ge=0, default=0)
    expenses: List[ExpenseRecord] = Field(default_factory=list)


class ExpenseAnomaly(BaseModel):
    category: str
    amount: float
    description: str
    reason: str


class ExpenseInsightsResponse(BaseModel):
    expected_next_month_expense: float
    top_category: str
    anomalies: List[ExpenseAnomaly]
    recommendations: List[str]


expense_category_model: Pipeline


def train_or_load_expense_model() -> Pipeline:
    MODEL_DIR.mkdir(exist_ok=True)

    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)

    dataset = pd.read_csv(DATASET_PATH)
    pipeline = Pipeline(
        steps=[
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True, min_df=1)),
            (
                "classifier",
                LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42),
            ),
        ]
    )
    pipeline.fit(dataset["description"], dataset["category"])
    joblib.dump(pipeline, MODEL_PATH)
    return pipeline


@app.on_event("startup")
def load_models():
    global expense_category_model
    expense_category_model = train_or_load_expense_model()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "fintrack-ai-service",
        "expense_category_model": MODEL_VERSION,
        "training_rows": int(pd.read_csv(DATASET_PATH).shape[0]),
    }


@app.post("/fraud-score", response_model=FraudResponse)
def fraud_score(payload: FraudRequest):
    score = 10
    reasons = []

    if payload.credit_score < 620:
        score += 24
        reasons.append("Credit score is below preferred loan threshold.")

    if payload.monthly_income > 0 and payload.requested_amount > payload.monthly_income * 18:
        score += 22
        reasons.append("Requested loan amount is high compared with monthly income.")

    if payload.identity_mismatch:
        score += 32
        reasons.append("Identity details do not match KYC records.")

    if payload.failed_attempts >= 3:
        score += 18
        reasons.append("Multiple failed verification attempts detected.")

    if payload.device_risk == "medium":
        score += 12
        reasons.append("Medium device risk signal found.")

    if payload.device_risk == "high":
        score += 22
        reasons.append("High-risk device or network pattern found.")

    if not payload.ip_country_matches_kyc:
        score += 18
        reasons.append("IP country does not match KYC country.")

    if payload.new_device:
        score += 8
        reasons.append("Application submitted from a new device.")

    final_score = min(score, 100)

    if final_score >= 70:
        return FraudResponse(
            risk_score=final_score,
            risk_level="HIGH",
            decision="BLOCK_AUTO_APPROVAL_AND_SEND_TO_MANUAL_REVIEW",
            reasons=reasons or ["High-risk application pattern detected."],
        )

    if final_score >= 40:
        return FraudResponse(
            risk_score=final_score,
            risk_level="MEDIUM",
            decision="REQUIRE_ADDITIONAL_VERIFICATION",
            reasons=reasons or ["Moderate fraud signal detected."],
        )

    return FraudResponse(
        risk_score=final_score,
        risk_level="LOW",
        decision="ALLOW_STANDARD_LOAN_WORKFLOW",
        reasons=reasons or ["No major fraud signals detected."],
    )


@app.post("/expense-category", response_model=ExpenseCategoryResponse)
def predict_expense_category(payload: ExpenseCategoryRequest):
    probabilities = expense_category_model.predict_proba([payload.description])[0]
    categories = expense_category_model.classes_
    ranked = sorted(
        [
            PredictionScore(category=str(category), confidence=round(float(probability), 4))
            for category, probability in zip(categories, probabilities)
        ],
        key=lambda item: item.confidence,
        reverse=True,
    )

    return ExpenseCategoryResponse(
        category=ranked[0].category,
        confidence=ranked[0].confidence,
        model_version=MODEL_VERSION,
        top_predictions=ranked[:3],
    )


@app.post("/expense-insights", response_model=ExpenseInsightsResponse)
def generate_expense_insights(payload: ExpenseInsightsRequest):
    expenses = payload.expenses
    if not expenses:
        return ExpenseInsightsResponse(
            expected_next_month_expense=0,
            top_category="No data",
            anomalies=[],
            recommendations=["Add expenses regularly to unlock ML-powered finance insights."],
        )

    amounts = [expense.amount for expense in expenses]
    expected_next_month = round(mean(amounts) * min(len(amounts), 30), 2)
    category_totals: Dict[str, float] = {}
    category_amounts: Dict[str, List[float]] = {}

    for expense in expenses:
        category = expense.category or "Other"
        category_totals[category] = category_totals.get(category, 0) + expense.amount
        category_amounts.setdefault(category, []).append(expense.amount)

    top_category = max(category_totals.items(), key=lambda item: item[1])[0]
    anomalies: List[ExpenseAnomaly] = []

    for expense in expenses:
        values = category_amounts.get(expense.category or "Other", [])
        if len(values) < 3:
            continue

        category_average = mean(values)
        threshold = max(category_average * 2.2, 1200)
        if expense.amount > threshold:
            anomalies.append(
                ExpenseAnomaly(
                    category=expense.category or "Other",
                    amount=expense.amount,
                    description=expense.description,
                    reason=f"{expense.category} spend is above the usual average of Rs. {round(category_average)}.",
                )
            )

    recommendations = [
        f"{top_category} is your highest spending category. Review recurring entries there first.",
    ]

    if payload.total_income > 0:
        safe_budget = payload.total_income * 0.72
        if expected_next_month > safe_budget:
            recommendations.append(
                f"Forecast is above the safe budget. Reduce around Rs. {round(expected_next_month - safe_budget)} next month."
            )
        else:
            recommendations.append("Forecast is within a healthy budget range for the entered income.")

    if anomalies:
        recommendations.append(f"Review unusual {anomalies[0].category} expense of Rs. {round(anomalies[0].amount)}.")

    return ExpenseInsightsResponse(
        expected_next_month_expense=expected_next_month,
        top_category=top_category,
        anomalies=anomalies[:5],
        recommendations=recommendations[:5],
    )
