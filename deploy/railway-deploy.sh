#!/usr/bin/env bash
# Deploy APEPLOYEE to Railway using a PROJECT TOKEN (no password/SSO login).
#
# One-time (you, in the Railway dashboard):
#   1. Create a project (empty). Make sure billing/trial credits are enabled.
#   2. Project → Settings → Tokens → create a Project Token. Copy it.
#   3. export RAILWAY_TOKEN=<that token>
#
# Then run this script from the repo root:  bash deploy/railway-deploy.sh
set -euo pipefail

: "${RAILWAY_TOKEN:?set RAILWAY_TOKEN to a Railway project token first}"
RAILWAY="npx -y @railway/cli@latest"
JWT=$(openssl rand -hex 32)

echo "==> Setting production environment variables"
$RAILWAY variables \
  --set "NODE_ENV=production" \
  --set "DATABASE_URL=file:/data/prod.db" \
  --set "PUBLIC_BASE_URL=https://apeployee.fun" \
  --set "FRONTEND_URL=https://apeployee.fun" \
  --set "TOKEN_NAME=Apeployee" \
  --set "TICKER=\$APEPLOYEE" \
  --set "JWT_SECRET=$JWT" \
  --set "DAILY_SHILL_CAP=20" \
  --set "AUTOPAY=false" \
  --set "SOLANA_RPC_URL=https://api.mainnet-beta.solana.com" \
  --set "PUMPFUN_CLAIM_MODE=off"

echo "==> Deploying (builds the root Dockerfile, uploads this repo)"
$RAILWAY up --detach

echo "==> Adding the custom domain"
$RAILWAY domain apeployee.fun || echo "  (add apeployee.fun in the dashboard if this errored; note the CNAME target it shows)"

echo ""
echo "DONE. Next:"
echo "  - Attach a Volume mounted at /data (Railway dashboard) so the DB persists."
echo "  - Point Porkbun DNS at the Railway target: bash deploy/porkbun-dns.sh <railway-cname-target>"
echo "  - Later, to go fully live: set SOLANA_PRIVATE_KEY (payouts), run the NFT mint,"
echo "    then set PUMPFUN_CLAIM_MODE=pumpportal + PUMPFUN_TOKEN_MINT + AUTOPAY=true."
