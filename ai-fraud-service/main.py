from typing import List, Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field


app = FastAPI(
    title="FinTech Loan Fraud Detection Service",
    version="0.1.0",
    description="Python AI-style risk service for loan application fraud signals.",
)


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


@app.get("/health")
def health():
    return {"status": "ok", "service": "loan-fraud-detection"}


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
