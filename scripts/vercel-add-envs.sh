#!/usr/bin/env bash
set -euo pipefail

# Usage (preferred):
# export VERCEL_TOKEN="<your_vercel_token>"
# export VERCEL_PROJECT="<your_vercel_project_name_or_id>" \
#   NEXT_PUBLIC_SUPABASE_URL_VALUE="..." NEXT_PUBLIC_SUPABASE_ANON_KEY_VALUE="..." \
#   R2_ACCOUNT_ID_VALUE="..." R2_ACCESS_KEY_ID_VALUE="..." R2_SECRET_ACCESS_KEY_VALUE="..." \
#   R2_BUCKET_NAME_VALUE="..." NEXT_PUBLIC_SITE_URL_VALUE="..." \
#   NEXT_PUBLIC_META_PIXEL_ID_VALUE="..." \
#   bash scripts/vercel-add-envs.sh

command -v vercel >/dev/null 2>&1 || { echo "Install Vercel CLI first: npm i -g vercel" >&2; exit 1; }
: "${VERCEL_TOKEN?Need VERCEL_TOKEN env var (Vercel Personal Token)}"
: "${VERCEL_PROJECT?Need VERCEL_PROJECT env var (project name or id)}"

vars=(
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  R2_ACCOUNT_ID
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET_NAME
  NEXT_PUBLIC_SITE_URL
  NEXT_PUBLIC_META_PIXEL_ID
)

for v in "${vars[@]}"; do
  val_var="${v}_VALUE"
  val="${!val_var:-}"
  if [ -z "$val" ]; then
    echo "Missing $val_var for $v — set it as an env var before running." >&2
    exit 1
  fi

  echo "Adding/ensuring $v in project $VERCEL_PROJECT"
  # Try to add; ignore non-zero to allow existing values (you can remove --yes if you want interactive)
  vercel env add "$v" production "$val" --token "$VERCEL_TOKEN" --project "$VERCEL_PROJECT" || true
done

echo "Done. If variables already existed, confirm in Vercel dashboard or run 'vercel env ls --project $VERCEL_PROJECT --token $VERCEL_TOKEN' to verify." 
