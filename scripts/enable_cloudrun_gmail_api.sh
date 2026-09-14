#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-project-424147c2-3cf6-4c26-b18}"
REGION="${REGION:-asia-south1}"
API_SERVICE="${API_SERVICE:-fintrack-verification-api}"

store_secret_version() {
  local secret_name="$1"
  local prompt="$2"
  local secret_value
  read -r -s -p "$prompt" secret_value
  echo
  if [[ -z "$secret_value" ]]; then
    echo "A required value was not entered; no Cloud Run change was made." >&2
    exit 2
  fi
  if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" >/dev/null 2>&1; then
    printf '%s' "$secret_value" | gcloud secrets versions add "$secret_name" \
      --project="$PROJECT_ID" --data-file=- >/dev/null
  else
    printf '%s' "$secret_value" | gcloud secrets create "$secret_name" \
      --project="$PROJECT_ID" --replication-policy=automatic --data-file=- >/dev/null
  fi
  unset secret_value
}

gcloud config set project "$PROJECT_ID" >/dev/null
gcloud services enable secretmanager.googleapis.com run.googleapis.com

store_secret_version verification-gmail-client-id \
  "Paste Render GMAIL_CLIENT_ID (hidden), then press Enter: "
store_secret_version verification-gmail-client-secret \
  "Paste Render GMAIL_CLIENT_SECRET (hidden), then press Enter: "
store_secret_version verification-gmail-refresh-token \
  "Paste Render GMAIL_REFRESH_TOKEN (hidden), then press Enter: "
store_secret_version verification-mail-from \
  "Paste APP_MAIL_FROM as FinTrack <your-email@gmail.com> (hidden), then press Enter: "

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
for secret_name in \
  verification-gmail-client-id \
  verification-gmail-client-secret \
  verification-gmail-refresh-token \
  verification-mail-from; do
  gcloud secrets add-iam-policy-binding "$secret_name" \
    --project="$PROJECT_ID" \
    --member="serviceAccount:${RUNTIME_SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" >/dev/null
done

gcloud run services update "$API_SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --update-env-vars="APP_MAIL_ENABLED=true,APP_MAIL_PROVIDER=gmail-api" \
  --update-secrets="GMAIL_CLIENT_ID=verification-gmail-client-id:latest,GMAIL_CLIENT_SECRET=verification-gmail-client-secret:latest,GMAIL_REFRESH_TOKEN=verification-gmail-refresh-token:latest,APP_MAIL_FROM=verification-mail-from:latest" \
  --quiet

API_URL="$(gcloud run services describe "$API_SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
echo
echo "GMAIL_API_CONFIGURATION_READY"
echo "API URL: $API_URL"
curl --fail --silent --show-error --max-time 60 "$API_URL/api/users/auth-config"
echo
