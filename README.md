# 🦍 APEPLOYEE

**The first memecoin where you get PAID to shill your bags.**

> The market is rough. People need work. We're hiring.

Apply for a monkey-themed job, get **APELOYED**, post about the ticker on X, and get
paid SOL from pump.fun creator fees — while **Worker Pass NFTs auto-mine** to your
locker and boost your pay. **No wallet ever connects to the site**: you sign in with
your X account and just paste the Solana address your wages should go to.

## How it works

1. **Sign in with X** (OAuth 2.0 PKCE — proves you own the account). No keys configured? The app runs in clearly-labeled demo mode.
2. **Get a job** — 7 roles (Bag Worker, Meme Maker, Shill Captain, Reply Guy, Chart Watcher, Vibe Manager, Banana Accountant). Instant hire; your first job mines you a welcome Worker Pass.
3. **Shill** — paste a link to your own X post that mentions the ticker. The server verifies the author and the mention, then pays wages by engagement: `(likes·10k + RTs·20k + replies·5k + views·100 lamports) × rank × pass boost`. Engagement is re-polled for 48h so wages grow with the post.
4. **Rank up** — Chimpanzee → Baboon → Orangutan → Gorilla → Silverback (1.0x → 3.0x pay).
5. **Auto-mine NFTs** — every 5 shills mines a Worker Pass from the 1000-piece collection (5 tiers, Common→Legendary). Your best pass sets a 1.05x–1.5x pay boost.
6. **Get paid** — payouts go straight to your pasted address from the vault wallet; optional daily auto-pay cron. Vault is funded by pump.fun creator-fee sweeps.

## Stack

- **Backend** — Node/Express + Prisma on **SQLite** (zero setup; swap the provider for Postgres in production). X API for verification/metrics, `@solana/web3.js` for payouts, node-cron for re-polling + auto-pay.
- **Frontend** — React 18 + Vite + Tailwind, dark jungle-office theme, the NFT art as the visual identity.
- **NFTs** — `nft/` holds the full 1000-pass generative collection (deterministic generator, images, Metaplex metadata, manifest). On-chain cNFT minting via Metaplex Bubblegum is the next phase; the register tracks `mintSig` per pass.

## Run it

```bash
cd backend
npm install
npx prisma db push
node seed.js        # 7 jobs + the 1000-pass NFT register
node server.js      # API on :3001
```

```bash
cd frontend
npm install
npm run dev         # UI on :5173 (proxies /api and /nft to :3001)
```

Open http://localhost:5173 — with no API keys set, the app runs in demo mode
(handle-only sign-in, simulated engagement and payouts, all labeled in the UI).

## Going live

Fill in `backend/.env`:

| Variable | Effect when set |
|---|---|
| `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET` | Real "Sign in with X" (OAuth 2.0 PKCE) |
| `TWITTER_BEARER_TOKEN` | Real tweet verification + engagement metrics (X API is pay-per-use: ~$0.005/tweet read) |
| `SOLANA_PRIVATE_KEY` | Real SOL payouts from the vault keypair (start on devnet!) |
| `AUTOPAY=true` | Daily automatic payout run at 12:00 |
| `TICKER` | The cashtag every shill must mention |

**Honest warnings** (read before launch):
- X banned "reward users for posting" apps in Jan 2026 (the InfoFi purge) and revokes API keys without notice. Weight rewards toward holding + on-site work, keep tweet submission opt-in, and have a fallback plan.
- Paid token promotion without disclosure can create legal exposure (FTC). Encourage workers to disclose.
- The vault is a hot wallet: fund it with only what you're ready to pay out.

## Repo map

```
backend/    Express API + Prisma schema + seed (SQLite dev.db)
frontend/   React app (views in src/views, theme in src/index.css)
nft/        Worker Pass collection: generator, 1000 images + metadata, manifest
programs/   (parked) Anchor vault program — superseded by the backend hot wallet for now
```
