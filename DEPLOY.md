# 🦍 APEPLOYEE — Go-Live Runbook (apeployee.fun)

Everything below is what turns the finished app into a live site with real NFTs and
auto-distributing fees. Each section says exactly what **you** provide (accounts,
funds, keys) and what happens automatically.

The app already runs fully in **demo mode** with zero of this. These steps flip on
the real, on-chain, hosted version.

---

## 1. Host the site + backend on Railway (single service)

The whole app is one Node service — it serves the API, the website, and the NFT
images/metadata from the same origin, so `apeployee.fun` works with no CORS and the
login cookie just works.

1. Push this repo to GitHub.
2. On [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo** →
   pick this repo. Railway auto-detects the `Dockerfile`.
3. **Add a Volume** (Railway → service → Variables/Volumes) mounted at `/data` so the
   database survives redeploys.
4. Set these **environment variables** (Railway → Variables):

   ```
   NODE_ENV=production
   DATABASE_URL=file:/data/prod.db
   PUBLIC_BASE_URL=https://apeployee.fun
   FRONTEND_URL=https://apeployee.fun
   TOKEN_NAME=Apeployee
   TICKER=$APEPLOYEE
   JWT_SECRET=<paste a long random string>          # e.g. `openssl rand -hex 32`
   AUTOPAY=false                                     # flip to true once the vault is funded
   DAILY_SHILL_CAP=20
   # Solana / NFTs / fees — fill in sections 2–4 below
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_PRIVATE_KEY=
   NFT_MERKLE_TREE=
   NFT_COLLECTION_MINT=
   PUMPFUN_CLAIM_MODE=off
   PUMPFUN_TOKEN_MINT=
   # X verification (optional, section 5)
   TWITTER_CLIENT_ID=
   TWITTER_CLIENT_SECRET=
   TWITTER_BEARER_TOKEN=
   TWITTER_CALLBACK_URL=https://apeployee.fun/api/auth/x/callback
   ```
5. Railway gives the service a URL and does the healthcheck at `/health`.

### Point apeployee.fun (Porkbun) at Railway
1. Railway → service → **Settings → Networking → Custom Domain** → add
   `apeployee.fun` (and `www.apeployee.fun`). Railway shows a **CNAME target**.
2. In **Porkbun → Details for apeployee.fun → DNS**:
   - Add a **CNAME** record: host `www` → value = the Railway target.
   - For the root domain, use Porkbun's **ALIAS/CNAME flattening** (Porkbun supports
     `ALIAS` on the root): host blank/`@` → the Railway target.
   - (If you prefer an A record, Railway also gives an IP for that.)
3. Wait for DNS + Railway's automatic HTTPS cert (a few minutes). Done — the site is
   live at https://apeployee.fun.

> I've prepared all the config; I can't create your Railway/Porkbun accounts or read
> their credentials, so these clicks are yours. Ping me if any step errors and I'll
> debug the exact output.

---

## 2. The vault wallet (funds the payroll)

The vault is one Solana keypair. It (a) pays workers and (b) is the pump.fun creator
wallet that fees are claimed into.

1. Create a keypair: `solana-keygen new --outfile vault.json` (or export from Phantom).
2. Fund it with SOL (mainnet). It needs enough for: NFT setup (~1–2 SOL, section 3) +
   ongoing payouts + a little for fees.
3. Put the **base58 private key** in `SOLANA_PRIVATE_KEY` (Railway var). This flips
   payouts from SIMULATED → LIVE automatically.

> Handling the private key is yours to do — I never take custody of funds. Paste it
> into Railway's encrypted vars, not into the repo.

---

## 3. Real NFTs on-chain (Magic Eden / Tensor) — MAINNET

The 1000 Worker Passes become real compressed NFTs (Metaplex Bubblegum). Because
they're a verified Metaplex collection, Magic Eden and Tensor auto-index them via the
DAS API — they show up as real NFTs in wallets and on marketplaces.

**Cost (mainnet, approx):** Merkle tree (16k capacity) ~1.5 SOL one-time + collection
NFT ~0.01 SOL + ~0.00001 SOL per cNFT (~0.01 SOL for all 1000). Budget ~1.5–2 SOL.

**Steps** (run once, with `SOLANA_PRIVATE_KEY` set to the funded mainnet vault and
`SOLANA_RPC_URL` = a mainnet RPC — a Helius/Triton RPC is strongly recommended over
the public one for cNFTs + DAS reads):

```bash
cd backend
node scripts/setup-nft.js         # creates the Merkle tree + collection NFT, prints 2 values
# paste the printed NFT_MERKLE_TREE and NFT_COLLECTION_MINT into your env, then:
node scripts/mint-existing.js     # mints every already-assigned pass on-chain
```

From then on the server auto-mints each pass to the worker's payout address the moment
it's mined. Passes mined before a worker sets an address are held in vault custody and
can be minted to them later.

**Utility = the boost is real and on-chain-gated:** a worker only gets the pay boost
while **wearing** a pass they own (equip in MY_DESK). This is the NFT's utility.

> This spends real SOL and is irreversible, so I won't run it unprompted. Once your
> funded mainnet key is in `.env`, either run the two commands above yourself, or tell
> me "mint mainnet now" and I'll run them and confirm the on-chain result.

### Getting a collection page on Magic Eden
Once minted, the collection is auto-indexed. To claim/customize the ME collection page
(banner, description, socials), use Magic Eden's **Creator Hub** with the vault wallet
that created the collection. Tensor lists automatically from the collection mint.

---

## 4. Auto-claim + auto-distribute pump.fun creator fees

Once $APEPLOYEE is launched on pump.fun **with the vault wallet as the creator**:

```
PUMPFUN_CLAIM_MODE=pumpportal
PUMPFUN_TOKEN_MINT=<the $APEPLOYEE mint address>
AUTOPAY=true
```

- Every 3 minutes the server claims creator fees into the vault (logged as `FEE_SWEEP`
  in the public vault ledger).
- Every 10 minutes it distributes wages to all workers over the 0.005 SOL minimum.
- All of it shows on the public **PAYROLL** and **vault ledger** with tx proof.

> Needs the token live on pump.fun and the creator = your vault wallet. Tell me the
> mint address when it's launched and I'll verify the claim flow against it.

---

## 5. X (Twitter) verification — see the explainer in the chat

Set `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` / `TWITTER_BEARER_TOKEN` and the
callback to `https://apeployee.fun/api/auth/x/callback` to turn on real "Sign in with
X". Until then, handle-only demo login works and payouts aren't X-gated.

---

## Launch-day order of operations
1. Deploy to Railway + point apeployee.fun (section 1). Site is live in demo mode.
2. Fund the vault, set `SOLANA_PRIVATE_KEY` (section 2). Payouts go live.
3. Mint the NFTs on mainnet (section 3). Passes are real.
4. Launch $APEPLOYEE on pump.fun with the vault as creator, set fee vars (section 4).
   Fees auto-claim and auto-distribute.
5. (Optional) Turn on X verification (section 5).
