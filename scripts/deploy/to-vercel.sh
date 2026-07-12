#!/usr/bin/env bash
# Deploy the repo to Vercel using the CLI
set -euo pipefail

if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "ERROR: VERCEL_TOKEN environment variable is required"
  exit 2
fi

echo "Installing dependencies and building client..."
npm ci
npm run build

echo "Deploying to Vercel (production)..."
vercel --prod --confirm --token "$VERCEL_TOKEN"

echo "Deployed."
