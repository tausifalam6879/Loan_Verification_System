#!/usr/bin/env bash
set -euo pipefail

# Run from Google Cloud Shell. Secret values are read without terminal echo and
# are stored in Secret Manager; they are never written into the repository.
PROJECT_ID="${PROJECT_ID:-project-424147c2-3cf6-4c26-b18}"
REGION="${REGION:-asia-south1}"
AI_SERVICE="${AI_SERVICE:-fintrack-verification-ai}"
API_SERVICE="${API_SERVICE:-fintrack-verification-api}"
DB_HOST="${DB_HOST:-ep-broad-waterfall-az2hkz08-pooler.c-3.ap-southeast-1.aws.neon.tech}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-neondb}"
DB_USER="${DB_USER:-neondb_owner}"

ensure_secret() {
  local secret_name="$1"
  local prompt="$2"
  local required="${3:-true}"

  if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    return 0
  fi

  local secret_value
  read -r -s -p "$prompt" secret_value
  echo
  if [[ -z "$secret_value" ]]; then
    if [[ "$required" == "true" ]]; then
      echo "A required value was not entered; deployment stopped safely." >&2
      exit 2
    fi
    return 1
  fi

  printf '%s' "$secret_value" | gcloud secrets create "$secret_name" \
    --project="$PROJECT_ID" \
    --replication-policy=automatic \
    --data-file=- >/dev/null
  unset secret_value
}

gcloud config set project "$PROJECT_ID" >/dev/null
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

ensure_secret "verification-neon-password" "Paste the current Neon password (hidden), then press Enter: "

if ! gcloud secrets describe verification-jwt-secret --project="$PROJECT_ID" >/dev/null 2>&1; then
  python3 -c 'import secrets; print(secrets.token_urlsafe(64), end="")' \
    | gcloud secrets create verification-jwt-secret \
        --project="$PROJECT_ID" \
        --replication-policy=automatic \
        --data-file=- >/dev/null
fi

GEMINI_SECRET=""
if gcloud secrets describe verification-gemini-api-key --project="$PROJECT_ID" >/dev/null 2>&1; then
  GEMINI_SECRET="verification-gemini-api-key"
elif ensure_secret "verification-gemini-api-key" "Paste the Gemini API key (hidden), or press Enter to configure it later: " false; then
  GEMINI_SECRET="verification-gemini-api-key"
fi

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
for secret_name in verification-neon-password verification-jwt-secret ${GEMINI_SECRET:-}; do
  gcloud secrets add-iam-policy-binding "$secret_name" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" >/dev/null
done

AI_SECRETS=()
if [[ -n "$GEMINI_SECRET" ]]; then
  AI_SECRETS+=(--set-secrets="GEMINI_API_KEY=${GEMINI_SECRET}:latest")
fi

gcloud run deploy "$AI_SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --source=ai-fraud-service \
  --allow-unauthenticated \
  --cpu=1 \
  --memory=1Gi \
  --min=1 \
  --max=2 \
  --concurrency=20 \
  --timeout=120 \
  --set-env-vars="LLM_PROVIDER=gemini,LLM_MODEL=gemini-3.5-flash-lite,LLM_TIMEOUT_MS=12000" \
  "${AI_SECRETS[@]}" \
  --quiet

AI_URL="$(gcloud run services describe "$AI_SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"

API_SECRETS="DB_PASSWORD=verification-neon-password:latest,JWT_SECRET=verification-jwt-secret:latest"
if [[ -n "$GEMINI_SECRET" ]]; then
  API_SECRETS+=",GEMINI_API_KEY=${GEMINI_SECRET}:latest"
fi

gcloud run deploy "$API_SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --source=. \
  --allow-unauthenticated \
  --cpu=1 \
  --memory=1Gi \
  --min=1 \
  --max=3 \
  --concurrency=40 \
  --timeout=120 \
  --set-env-vars="SPRING_PROFILES_ACTIVE=production,DB_HOST=${DB_HOST},DB_PORT=${DB_PORT},DB_NAME=${DB_NAME},DB_USER=${DB_USER},AI_SERVICE_URL=${AI_URL},APP_AI_SERVICE_URL=${AI_URL},APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://tausifalam6879.github.io,APP_OTP_ENABLED=true,APP_OTP_CONSOLE_FALLBACK_ENABLED=false,APP_MAIL_ENABLED=false,APP_SMS_ENABLED=false,APP_WHATSAPP_ENABLED=false,LLM_PROVIDER=gemini,LLM_MODEL=gemini-3.5-flash-lite,LLM_TIMEOUT_MS=10000" \
  --set-secrets="$API_SECRETS" \
  --quiet

API_URL="$(gcloud run services describe "$API_SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"

echo
echo "VERIFICATION_CLOUD_RUN_READY"
echo "AI URL: $AI_URL"
echo "API URL: $API_URL"
curl --fail --silent --show-error --max-time 60 "$AI_URL/health"
echo
curl --fail --silent --show-error --max-time 60 "$API_URL/api/users/test"
echo
echo "NEXT_FRONTEND_API_BASE=${API_URL}/api"
