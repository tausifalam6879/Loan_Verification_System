from main import (
    ExpenseInsightsRequest,
    ExpenseRecord,
    FraudRequest,
    fraud_score,
    generate_expense_insights,
    health,
)


def test_health_reports_training_data_and_model_version():
    response = health()

    assert response["status"] == "ok"
    assert response["service"] == "fintrack-ai-service"
    assert response["expense_category_model"] == "tfidf-logreg-v1"
    assert response["training_rows"] > 0


def test_fraud_score_allows_a_low_risk_application():
    response = fraud_score(
        FraudRequest(
            applicant_name="Demo User",
            credit_score=735,
            monthly_income=75000,
            requested_amount=600000,
        )
    )

    assert response.risk_level == "LOW"
    assert response.decision == "ALLOW_STANDARD_LOAN_WORKFLOW"
    assert response.risk_score == 10


def test_fraud_score_blocks_high_risk_identity_and_device_signals():
    response = fraud_score(
        FraudRequest(
            applicant_name="Risky User",
            credit_score=550,
            monthly_income=20000,
            requested_amount=900000,
            failed_attempts=4,
            identity_mismatch=True,
            device_risk="high",
            ip_country_matches_kyc=False,
            new_device=True,
        )
    )

    assert response.risk_level == "HIGH"
    assert response.decision == "BLOCK_AUTO_APPROVAL_AND_SEND_TO_MANUAL_REVIEW"
    assert response.risk_score == 100
    assert len(response.reasons) >= 5


def test_expense_insights_handles_empty_history():
    response = generate_expense_insights(ExpenseInsightsRequest(total_income=50000, expenses=[]))

    assert response.expected_next_month_expense == 0
    assert response.top_category == "No data"
    assert response.anomalies == []
    assert response.recommendations


def test_expense_insights_returns_category_and_saving_context():
    response = generate_expense_insights(
        ExpenseInsightsRequest(
            total_income=50000,
            expenses=[
                ExpenseRecord(amount=900, category="Food", description="Groceries"),
                ExpenseRecord(amount=1100, category="Food", description="Groceries"),
                ExpenseRecord(amount=5000, category="Food", description="Celebration dinner"),
                ExpenseRecord(amount=1200, category="Travel", description="Metro card"),
            ],
        )
    )

    assert response.expected_next_month_expense > 0
    assert response.top_category == "Food"
    assert response.recommendations
    assert all(anomaly.amount >= 0 for anomaly in response.anomalies)
