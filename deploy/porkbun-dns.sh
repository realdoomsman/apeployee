#!/usr/bin/env bash
# Point apeployee.fun (Porkbun) at Railway via the Porkbun API (no dashboard login).
#
# One-time (you, in Porkbun):
#   1. Account → API Access → enable API, generate an API Key + Secret Key.
#   2. On the domain → make sure "API Access" toggle is ON for apeployee.fun.
#   3. export PORKBUN_API_KEY=pk1_...   PORKBUN_SECRET_KEY=sk1_...
#
# Usage:  bash deploy/porkbun-dns.sh <railway-target-host>
#   <railway-target-host> is the CNAME target Railway shows for the custom domain,
#   e.g. abcd1234.up.railway.app
set -euo pipefail

TARGET="${1:?pass the Railway CNAME target host, e.g. xxxx.up.railway.app}"
: "${PORKBUN_API_KEY:?set PORKBUN_API_KEY}"
: "${PORKBUN_SECRET_KEY:?set PORKBUN_SECRET_KEY}"
DOMAIN="apeployee.fun"
AUTH="\"apikey\":\"$PORKBUN_API_KEY\",\"secretapikey\":\"$PORKBUN_SECRET_KEY\""

echo "==> Ping (auth check)"
curl -s -X POST "https://api.porkbun.com/api/json/v3/ping" -d "{$AUTH}"; echo

# Root domain → ALIAS/CNAME flattening to the Railway target
echo "==> Root ALIAS $DOMAIN -> $TARGET"
curl -s -X POST "https://api.porkbun.com/api/json/v3/dns/create/$DOMAIN" \
  -d "{$AUTH,\"type\":\"ALIAS\",\"name\":\"\",\"content\":\"$TARGET\",\"ttl\":\"600\"}"; echo

# www subdomain → CNAME
echo "==> www CNAME -> $TARGET"
curl -s -X POST "https://api.porkbun.com/api/json/v3/dns/create/$DOMAIN" \
  -d "{$AUTH,\"type\":\"CNAME\",\"name\":\"www\",\"content\":\"$TARGET\",\"ttl\":\"600\"}"; echo

echo ""
echo "DONE. DNS + Railway's automatic HTTPS take a few minutes to go green at https://apeployee.fun"
echo "If Porkbun rejects ALIAS on the root, use Railway's IP with an A record instead."
