// APEPLOYEE API v2 — X-account identity, no wallet connect.
// The market is waking up. New traders are coming. Everybody eats.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const twitter = require('./services/twitter');
const solana = require('./services/solana');
const nft = require('./services/nft');
const das = require('./services/das');
const pumpfun = require('./services/pumpfun');

const prisma = new PrismaClient();
const app = express();

const PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3001);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const TICKER = process.env.TICKER || '$APE';
const TOKEN_NAME = process.env.TOKEN_NAME || 'Apeployee';
const DAILY_SHILL_CAP = Number(process.env.DAILY_SHILL_CAP || 20);
const MIN_PAYOUT_LAMPORTS = 5_000_000; // 0.005 SOL
const COOKIE = 'ape_session';
const CLUSTER = (process.env.SOLANA_RPC_URL || '').includes('devnet') ? 'devnet' : 'mainnet';
const txExplorer = (sig) => `https://solscan.io/tx/${sig}${CLUSTER === 'devnet' ? '?cluster=devnet' : ''}`;

// JWT secret: must be set in production, or sessions are forgeable.
const JWT_SECRET = process.env.JWT_SECRET || (PROD ? null : 'dev-only-insecure-secret');
if (!JWT_SECRET) { console.error('FATAL: JWT_SECRET must be set in production'); process.exit(1); }

// Optional on-chain minting (safe no-op unless configured).
let mint = { enabled: () => false };
try { mint = require('./services/mint'); } catch { /* metaplex not installed/configured */ }

// Pending X-ownership verifications: verifyId -> { handle, code, expires }.
const crypto = require('crypto');
const pendingVerify = new Map();
setInterval(() => { const now = Date.now(); for (const [k, v] of pendingVerify) if (v.expires < now) pendingVerify.delete(k); }, 60_000).unref();

// Same-origin in production (frontend served by this server) → no CORS needed.
// In dev the Vite proxy also makes it same-origin, but allow the dev origin too.
app.use(cors({ origin: PROD ? true : [FRONTEND_URL], credentials: true }));
app.use(express.json());

// ---------- NFT static + metadata ----------
app.use('/nft/images', express.static(path.join(__dirname, '..', 'nft', 'output', 'images'), { maxAge: '7d', immutable: true }));

app.get('/nft/collection.json', (_req, res) => {
  res.json({
    name: 'Apeployee Worker Pass',
    symbol: 'APEPLOYEE',
    description: 'Official employee credentials for APEPLOYEE — the memecoin that hires. 1000 numbered Worker Passes, auto-mined to workers; wear one to boost your shill pay.',
    image: `${PUBLIC_BASE_URL}/nft/images/263.png`,
    external_url: PUBLIC_BASE_URL,
  });
});

app.get('/nft/metadata/:num', (req, res) => {
  const num = String(req.params.num).replace(/\.json$/i, '');
  if (!/^\d{3,4}$/.test(num)) return res.status(400).json({ error: 'bad pass number' });
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'nft', 'output', 'metadata', `${num}.json`), 'utf8'));
    meta.image = `${PUBLIC_BASE_URL}/nft/images/${num}.png`;
    meta.properties = { files: [{ uri: meta.image, type: 'image/png' }], category: 'image' };
    meta.external_url = PUBLIC_BASE_URL;
    res.json(meta);
  } catch {
    res.status(404).json({ error: 'no such pass' });
  }
});

// ---------- auth helpers ----------
function setSession(res, userId) {
  const token = jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: 'lax', secure: PROD, maxAge: 30 * 86400_000, path: '/',
  });
}
function clearSession(res) {
  res.cookie(COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: PROD, maxAge: 0, path: '/' });
}
function readToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}
async function requireAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) return res.status(401).json({ error: 'not signed in' });
    const { uid } = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) return res.status(401).json({ error: 'unknown user' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'session expired' });
  }
}

// ---------- ranks & pay ----------
const RANKS = [
  { name: 'CHIMPANZEE', label: 'Chimpanzee', emoji: '🐒', shills: 0, mult: 1.0 },
  { name: 'BABOON', label: 'Baboon', emoji: '🐵', shills: 10, mult: 1.2 },
  { name: 'ORANGUTAN', label: 'Orangutan', emoji: '🦧', shills: 50, mult: 1.5 },
  { name: 'GORILLA', label: 'Gorilla', emoji: '🦍', shills: 150, mult: 2.0 },
  { name: 'SILVERBACK', label: 'Silverback', emoji: '👑', shills: 500, mult: 3.0 },
];
const rankFor = (shills) => [...RANKS].reverse().find((r) => shills >= r.shills);
const rankInfo = (name) => RANKS.find((r) => r.name === name) || RANKS[0];

// Base 100_000 lamports (0.0001 SOL) per verified qualifying post so a fresh tweet
// pays something immediately; engagement adds on and is topped up as it grows.
// like 10_000, retweet 20_000, reply 5_000, view 100.
const BASE_PER_POST = 100_000;
const metricsToLamports = (m) => BASE_PER_POST + m.likes * 10_000 + m.retweets * 20_000 + m.replies * 5_000 + m.views * 100;

function publicUser(u, extra = {}) {
  const rank = rankInfo(u.apeRank);
  const next = RANKS.find((r) => r.shills > u.totalShills);
  return {
    id: u.id,
    handle: u.xUsername,
    verified: u.xVerified,
    demo: u.demo,
    payoutAddress: u.payoutAddress,
    rank: { ...rank },
    nextRank: next ? { label: next.label, emoji: next.emoji, shills: next.shills } : null,
    totalShills: u.totalShills,
    balance: Math.round(u.balance),
    lifetimeEarned: Math.round(u.lifetimeEarned),
    nftBoost: u.nftBoost,
    equippedPassId: u.equippedPassId,
    mine: nft.mineProgress(u.totalShills),
    ...extra,
  };
}

async function meResponse(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const [passCount, worn, applications] = await Promise.all([
    prisma.nftPass.count({ where: { ownerId: userId } }),
    user.equippedPassId != null ? prisma.nftPass.findUnique({ where: { id: user.equippedPassId } }) : null,
    prisma.application.findMany({ where: { userId }, include: { job: true } }),
  ]);
  return publicUser(user, {
    passCount,
    topPass: nft.withImage(worn),
    jobs: applications.map((a) => ({ role: a.job.role, title: a.job.title, emoji: a.job.emoji, status: a.status })),
  });
}

// ---------- status ----------
app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/status', (_req, res) => {
  res.json({
    app: TOKEN_NAME,
    ticker: TICKER,
    xMode: twitter.oauthLive() ? 'oauth' : 'verify', // real either way; 'verify' = post-a-code
    payoutMode: solana.isLive() ? 'live' : 'simulated',
    mintMode: mint.enabled() ? 'live' : 'off',
    feeMode: pumpfun.enabled() ? 'live' : 'off',
    autopay: process.env.AUTOPAY === 'true',
    mineEvery: nft.MINE_EVERY,
    dailyShillCap: DAILY_SHILL_CAP,
    cluster: CLUSTER,
    tokenMint: pumpfun.mint || null,
  });
});

// ---------- auth: real X ownership via proof-of-post ----------
// Step 1 — begin: user says which handle, we hand back a one-time code to post.
app.post('/api/auth/verify/begin', (req, res) => {
  const handle = String(req.body.handle || '').replace(/^@/, '').trim();
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) return res.status(400).json({ error: 'that does not look like an X handle' });
  // Bound the map so begin can't be spammed into unbounded memory growth.
  if (pendingVerify.size > 5000) {
    const now = Date.now();
    for (const [k, v] of pendingVerify) if (v.expires < now) pendingVerify.delete(k);
    if (pendingVerify.size > 5000) return res.status(503).json({ error: 'verification is busy — try again in a minute' });
  }
  const code = `APE-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const verifyId = crypto.randomBytes(16).toString('hex');
  pendingVerify.set(verifyId, { handle, code, expires: Date.now() + 15 * 60_000 });
  const tweetText = `Clocking in at APEPLOYEE 🦍 verifying my account for work. ${code}\n\napeployee.fun ${TICKER}`;
  res.json({ verifyId, code, handle, tweetText, intent: `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}` });
});

// Step 2 — confirm: user pastes the tweet URL; we read it back publicly and check
// the author handle + the code. Only the real account owner can pass this.
app.post('/api/auth/verify/confirm', async (req, res) => {
  try {
    const entry = pendingVerify.get(String(req.body.verifyId || ''));
    if (!entry || entry.expires < Date.now()) {
      pendingVerify.delete(String(req.body.verifyId || ''));
      return res.status(400).json({ error: 'verification expired — start again' });
    }
    const raw = String(req.body.url || '').trim();
    const m = raw.match(TWEET_URL) || raw.match(/^(\d{5,25})$/);
    if (!m) return res.status(400).json({ error: 'paste the link to the tweet you just posted' });

    let tweet;
    try { tweet = await twitter.fetchTweetPublic(m[1]); }
    catch (e) { return res.status(502).json({ error: `could not read that tweet on X (${e.message}) — give it a few seconds and retry` }); }

    if (tweet.authorHandle.toLowerCase() !== entry.handle.toLowerCase()) {
      return res.status(400).json({ error: `that tweet is from @${tweet.authorHandle}, not @${entry.handle}` });
    }
    if (!tweet.text.includes(entry.code)) {
      return res.status(400).json({ error: `the tweet must contain your code ${entry.code}` });
    }
    pendingVerify.delete(String(req.body.verifyId));

    // Key the account by the numeric X id. If the handle was held by another row
    // (e.g. a renamed account), free it so the verified owner takes it.
    let user = await prisma.user.findUnique({ where: { xId: tweet.authorId } });
    if (!user) {
      const clash = await prisma.user.findUnique({ where: { xUsername: tweet.authorHandle } });
      if (clash) await prisma.user.update({ where: { id: clash.id }, data: { xUsername: `${tweet.authorHandle}~old-${clash.id.slice(-5)}` } });
      try {
        user = await prisma.user.create({ data: { xId: tweet.authorId, xUsername: tweet.authorHandle, xVerified: true } });
      } catch (err) {
        if (err.code === 'P2002') user = await prisma.user.findUnique({ where: { xId: tweet.authorId } }); // lost a create race
        if (!user) throw err;
      }
    } else if (!user.xVerified || user.xUsername !== tweet.authorHandle) {
      user = await prisma.user.update({ where: { id: user.id }, data: { xVerified: true, xUsername: tweet.authorHandle } });
    }
    setSession(res, user.id);
    res.json({ user: await meResponse(user.id) });
  } catch (e) {
    console.error('[verify]', e);
    res.status(500).json({ error: 'verification failed — try again' });
  }
});

app.get('/api/auth/x/start', (req, res) => {
  if (!twitter.oauthLive()) return res.status(400).json({ error: 'X credentials not configured' });
  res.redirect(twitter.startAuth());
});

app.get('/api/auth/x/callback', async (req, res) => {
  try {
    const { xId, username } = await twitter.handleCallback(req.query.code, req.query.state);
    let user = await prisma.user.findUnique({ where: { xId } });
    if (!user) {
      // Real X identity is keyed by xId. If a demo account squatted this handle,
      // free the handle (rename the squatter) so the real owner claims it.
      const squatter = await prisma.user.findUnique({ where: { xUsername: username } });
      if (squatter && squatter.xId == null) {
        await prisma.user.update({ where: { id: squatter.id }, data: { xUsername: `${username}~demo-${squatter.id.slice(-5)}` } });
      }
      user = await prisma.user.create({ data: { xId, xUsername: username, xVerified: true } });
    }
    setSession(res, user.id);
    res.redirect(FRONTEND_URL);
  } catch (e) {
    console.error('[auth] x callback failed:', e.message);
    res.redirect(`${FRONTEND_URL}?auth_error=1`);
  }
});

app.post('/api/auth/logout', (_req, res) => { clearSession(res); res.json({ ok: true }); });

app.get('/api/me', requireAuth, async (req, res) => res.json({ user: await meResponse(req.user.id) }));

app.put('/api/me/payout', requireAuth, async (req, res) => {
  const address = String(req.body.address || '').trim();
  if (address && !solana.isValidAddress(address)) return res.status(400).json({ error: 'not a valid Solana address' });
  await prisma.user.update({ where: { id: req.user.id }, data: { payoutAddress: address || null } });
  // Pull in any passes this wallet already holds on-chain (e.g. bought on Magic Eden).
  if (address) await syncPasses(req.user.id).catch((e) => console.error('[das] payout sync:', e.message));
  res.json({ user: await meResponse(req.user.id) });
});

// On-chain ownership sync: any minted pass HELD by this worker's payout wallet
// becomes theirs in-app (marketplace buys carry the boost); whoever was wearing
// it before loses the equip. DB-only passes (not yet minted) are untouched.
async function syncPasses(userId) {
  if (!das.enabled()) return { synced: 0 };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.payoutAddress) return { synced: 0 };
  const held = await das.heldPassIds(user.payoutAddress, { fresh: true });
  let synced = 0;
  for (const id of held) {
    const claimed = await prisma.nftPass.updateMany({
      where: { id, mintSig: { not: null }, NOT: { ownerId: userId } },
      data: { ownerId: userId },
    });
    if (claimed.count) {
      synced++;
      // The previous wearer no longer holds it on-chain — strip their equip.
      await prisma.user.updateMany({ where: { equippedPassId: id, NOT: { id: userId } }, data: { equippedPassId: null, nftBoost: 1.0 } });
    }
  }
  await nft.refreshBoost(prisma, userId);
  return { synced };
}

const syncLast = new Map(); // userId -> ts (simple per-user cooldown)
app.post('/api/me/sync', requireAuth, async (req, res) => {
  if (!das.enabled()) return res.status(400).json({ error: 'on-chain sync not configured' });
  if (!req.user.payoutAddress) return res.status(400).json({ error: 'file a payout address first — passes are matched to that wallet' });
  if (Date.now() - (syncLast.get(req.user.id) || 0) < 15_000) return res.status(429).json({ error: 'syncing too fast — give it a few seconds' });
  if (syncLast.size > 5000) syncLast.clear();
  syncLast.set(req.user.id, Date.now());
  try {
    const r = await syncPasses(req.user.id);
    res.json({ ...r, user: await meResponse(req.user.id) });
  } catch (e) {
    res.status(502).json({ error: `chain read failed — try again shortly (${e.message})` });
  }
});

// Wear / take off a Worker Pass — only the worn pass grants a boost.
// A pass that's minted on-chain must still be HELD by the worker's payout wallet
// (or custodially by the vault) to be wearable — you can't sell it and keep the boost.
app.put('/api/me/equip', requireAuth, async (req, res) => {
  try {
    const passId = req.body.passId == null ? null : Number(req.body.passId);
    if (passId != null) {
      const pass = await prisma.nftPass.findFirst({ where: { id: passId, ownerId: req.user.id } });
      if (!pass) return res.status(400).json({ error: 'you do not own that Worker Pass' });
      if (pass.mintSig && das.enabled()) {
        try {
          const vault = solana.vaultPubkey();
          const ok = (req.user.payoutAddress && await das.holdsPass(req.user.payoutAddress, pass.id))
            || (vault && await das.holdsPass(vault, pass.id)); // custodial: minted before an address was filed
          if (!ok) return res.status(400).json({ error: 'that pass is no longer held by your payout wallet — sold or moved?' });
        } catch (e) {
          console.error('[das] equip check failed (allowing — cron re-verifies):', e.message);
        }
      }
    }
    await nft.equip(prisma, req.user.id, passId);
    res.json({ user: await meResponse(req.user.id) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ---------- jobs ----------
function jobShape(j, myStatus = null) {
  return { id: j.id, role: j.role, emoji: j.emoji, title: j.title, description: j.description, perk: j.perk, hired: j._count.applications, myStatus };
}
app.get('/api/jobs/public', async (_req, res) => {
  const jobs = await prisma.job.findMany({ where: { active: true }, include: { _count: { select: { applications: true } } } });
  res.json({ jobs: jobs.map((j) => jobShape(j)) });
});
app.get('/api/jobs', requireAuth, async (req, res) => {
  const jobs = await prisma.job.findMany({ where: { active: true }, include: { _count: { select: { applications: true } } } });
  const mine = await prisma.application.findMany({ where: { userId: req.user.id } });
  const byJob = new Map(mine.map((a) => [a.jobId, a.status]));
  res.json({ jobs: jobs.map((j) => jobShape(j, byJob.get(j.id) || null)) });
});

app.post('/api/jobs/:id/apply', requireAuth, async (req, res) => {
  try {
    const job = await prisma.job.findUnique({ where: { id: req.params.id } });
    if (!job || !job.active) return res.status(404).json({ error: 'job not found' });

    const result = await prisma.$transaction(async (tx) => {
      const firstJob = (await tx.application.count({ where: { userId: req.user.id } })) === 0;
      await tx.application.create({ data: { userId: req.user.id, jobId: job.id, status: 'APELOYED' } }); // P2002 → caught below
      const minedPass = firstJob ? await nft.minePass(tx, req.user.id, 'Common') : null;
      return { minedPass };
    });

    if (result.minedPass) mintOnChain(result.minedPass, req.user);
    res.json({
      application: { status: 'APELOYED', job: { title: job.title, emoji: job.emoji } },
      minedPass: nft.withImage(result.minedPass),
      user: await meResponse(req.user.id),
      message: `Congratulations — you are officially APELOYED as ${job.title}. Now bring in the new money.`,
    });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'you already work here' });
    console.error('[apply]', e);
    res.status(500).json({ error: 'could not process that application' });
  }
});

// ---------- shills ----------
// Matches /user/status/ID, /i/web/status/ID, /i/status/ID (x.com or twitter.com).
const TWEET_URL = /(?:x|twitter)\.com\/(?:[^/]+\/status|i\/web\/status|i\/status)\/(\d{5,25})/i;

// The post must mention the ticker as a cashtag or a standalone word (not too strict).
const TICKER_BARE = TICKER.replace(/^\$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TICKER_RE = new RegExp('(^|[^A-Za-z0-9])\\$?' + TICKER_BARE + '([^A-Za-z0-9]|$)', 'i');
function mentionsTicker(text) {
  return TICKER_RE.test(String(text || ''));
}

app.get('/api/shills', requireAuth, async (req, res) => {
  const shills = await prisma.shillRecord.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  res.json({ shills: shills.map((s) => ({ ...s, earned: Math.round(s.earned) })) });
});

app.post('/api/shills', requireAuth, async (req, res) => {
  try {
    const raw = String(req.body.url || '').trim();
    const match = raw.match(TWEET_URL) || raw.match(/^(\d{5,25})$/);
    if (!match) return res.status(400).json({ error: 'paste a link to your post on X (…x.com/you/status/123…)' });
    const tweetId = match[1];

    const hired = await prisma.application.count({ where: { userId: req.user.id } });
    if (hired === 0) return res.status(400).json({ error: 'you need a job first — visit the Jobs board and get APELOYED' });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.shillRecord.count({ where: { userId: req.user.id, createdAt: { gte: today } } });
    if (todayCount >= DAILY_SHILL_CAP) return res.status(429).json({ error: `daily cap reached (${DAILY_SHILL_CAP}) — even apes need rest` });

    if (!req.user.xVerified || !req.user.xId) {
      return res.status(400).json({ error: 'verify your X account first' });
    }
    let tweet;
    try { tweet = await twitter.fetchTweetPublic(tweetId); }
    catch (e) { return res.status(502).json({ error: `could not read that post on X (${e.message}) — retry in a moment` }); }
    if (tweet.authorId !== req.user.xId) {
      return res.status(400).json({ error: 'that post is not from your X account — shill with your own posts' });
    }
    if (!mentionsTicker(tweet.text)) {
      return res.status(400).json({ error: `the post has to mention ${TICKER} — that is the whole job` });
    }
    const metrics = tweet; const text = tweet.text;

    // Recompute the worn-pass boost right now so a stale nftBoost can never pay a
    // boost without an equipped pass (enforces "must wear to earn the boost").
    const boost = await nft.refreshBoost(prisma, req.user.id);
    // Freeze the multiplier at submit so re-polls can't retroactively re-price.
    const mult = rankInfo(req.user.apeRank).mult * boost;
    const earned = Math.round(metricsToLamports(metrics) * mult);

    const result = await prisma.$transaction(async (tx) => {
      const shill = await tx.shillRecord.create({
        data: {
          tweetId, userId: req.user.id, text, mult,
          likes: metrics.likes, retweets: metrics.retweets, replies: metrics.replies, views: metrics.views,
          earned, simulated: false, lastPolledAt: new Date(),
        },
      });
      // Atomic increment → use the RETURNED count so concurrent submits can't lose
      // updates or both trip the same mining milestone.
      const updated = await tx.user.update({
        where: { id: req.user.id },
        data: { totalShills: { increment: 1 }, balance: { increment: earned }, lifetimeEarned: { increment: earned } },
      });
      const newRank = rankFor(updated.totalShills);
      if (newRank.name !== updated.apeRank) await tx.user.update({ where: { id: req.user.id }, data: { apeRank: newRank.name } });
      const minedPass = updated.totalShills % nft.MINE_EVERY === 0 ? await nft.minePass(tx, req.user.id) : null;
      return { shill, minedPass, rankedUp: newRank.name !== req.user.apeRank ? newRank : null };
    });

    if (result.minedPass) mintOnChain(result.minedPass, req.user);
    res.json({
      shill: { ...result.shill, earned: Math.round(result.shill.earned) },
      earned,
      user: await meResponse(req.user.id),
      minedPass: nft.withImage(result.minedPass),
      rankedUp: result.rankedUp,
    });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'that post was already claimed — every post pays once' });
    console.error('[shill] submit failed:', e);
    res.status(500).json({ error: 'could not verify that post right now' });
  }
});

// ---------- passes ----------
app.get('/api/passes', requireAuth, async (req, res) => {
  const passes = await prisma.nftPass.findMany({ where: { ownerId: req.user.id }, orderBy: [{ boost: 'desc' }, { minedAt: 'desc' }] });
  res.json({ passes: passes.map((p) => ({ ...nft.withImage(p), equipped: p.id === req.user.equippedPassId })) });
});

app.get('/api/passes/registry', async (_req, res) => {
  const [byTier, minedByTier, recent] = await Promise.all([
    prisma.nftPass.groupBy({ by: ['tier'], _count: true }),
    prisma.nftPass.groupBy({ by: ['tier'], where: { ownerId: { not: null } }, _count: true }),
    prisma.nftPass.findMany({ where: { ownerId: { not: null } }, orderBy: { minedAt: 'desc' }, take: 8, include: { owner: { select: { xUsername: true } } } }),
  ]);
  const mined = new Map(minedByTier.map((t) => [t.tier, t._count]));
  res.json({
    tiers: nft.TIER_ORDER.map((tier) => ({ tier, total: byTier.find((t) => t.tier === tier)?._count || 0, mined: mined.get(tier) || 0 })),
    recent: recent.map((p) => ({ ...nft.withImage(p), owner: p.owner?.xUsername })),
  });
});

app.get('/api/registry/passes', async (req, res) => {
  const perPage = 48;
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const where = {};
  if (typeof req.query.tier === 'string' && nft.TIER_ORDER.includes(req.query.tier)) where.tier = req.query.tier;
  if (req.query.mined === 'true') where.ownerId = { not: null };
  if (req.query.mined === 'false') where.ownerId = null;
  const [total, passes] = await Promise.all([
    prisma.nftPass.count({ where }),
    prisma.nftPass.findMany({ where, orderBy: { id: 'asc' }, skip: (page - 1) * perPage, take: perPage, include: { owner: { select: { xUsername: true } } } }),
  ]);
  res.json({ total, page, perPage, passes: passes.map((p) => ({ ...nft.withImage(p), owner: p.owner?.xUsername || null })) });
});

// ---------- public proof feed (addresses masked) ----------
const maskAddr = (a) => (a && a.length > 8 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a);
app.get('/api/feed', async (_req, res) => {
  const [shills, payments] = await Promise.all([
    prisma.shillRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 25, include: { user: { select: { xUsername: true, xVerified: true } } } }),
    prisma.payment.findMany({ where: { status: { in: ['COMPLETED', 'SIMULATED'] } }, orderBy: { createdAt: 'desc' }, take: 25, include: { user: { select: { xUsername: true } } } }),
  ]);
  res.json({
    shills: shills.map((s) => ({
      id: s.id, handle: s.user.xUsername, verified: s.user.xVerified,
      tweetId: s.tweetId, url: `https://x.com/i/web/status/${s.tweetId}`,
      likes: s.likes, retweets: s.retweets, replies: s.replies, views: s.views,
      earned: Math.round(s.earned), simulated: s.simulated, createdAt: s.createdAt,
    })),
    payments: payments.map((p) => ({
      id: p.id, handle: p.user.xUsername, amount: Math.round(p.amount),
      address: maskAddr(p.address), status: p.status, signature: p.signature,
      explorer: p.signature ? txExplorer(p.signature) : null, createdAt: p.createdAt,
    })),
  });
});

// ---------- leaderboard ----------
app.get('/api/leaderboard', async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { lifetimeEarned: 'desc' }, take: 20,
    include: { passes: { orderBy: { boost: 'desc' }, take: 1 }, _count: { select: { passes: true } } },
  });
  res.json({
    leaders: users.map((u, i) => ({
      position: i + 1, handle: u.xUsername, verified: u.xVerified, rank: rankInfo(u.apeRank),
      lifetimeEarned: Math.round(u.lifetimeEarned), totalShills: u.totalShills, passCount: u._count.passes,
      avatar: u.passes[0] ? nft.passImageUrl(u.passes[0].id) : null,
    })),
  });
});

app.get('/api/stats', async (_req, res) => {
  const [workers, mined, paid, owed] = await Promise.all([
    prisma.user.count(),
    prisma.nftPass.count({ where: { ownerId: { not: null } } }),
    prisma.payment.aggregate({ where: { status: { in: ['COMPLETED', 'SIMULATED'] } }, _sum: { amount: true } }),
    prisma.user.aggregate({ _sum: { balance: true } }),
  ]);
  res.json({ workers, mined, totalPasses: 1000, totalPaid: Math.round(paid._sum.amount || 0), totalOwed: Math.round(owed._sum.balance || 0) });
});

// ---------- payouts (idempotent, reconciled) ----------
async function executePayout(user) {
  const amount = Math.round(user.balance);
  if (amount < MIN_PAYOUT_LAMPORTS) return { error: `minimum payout is ${MIN_PAYOUT_LAMPORTS / 1e9} SOL` };
  // Real X verification is required to get paid (blocks handle-squatting for wages).
  if (!user.xVerified) return { error: 'verify your X account to get paid' };
  if (!user.payoutAddress) return { error: 'set a payout address first (Profile → payout address)' };

  // Reserve atomically so concurrent requests can't double-pay.
  const reserved = await prisma.user.updateMany({ where: { id: user.id, balance: { gte: amount } }, data: { balance: { decrement: amount } } });
  if (reserved.count === 0) return { error: 'balance changed — try again' };

  // Durable record BEFORE sending, so a crash mid-send is always reconcilable.
  const payment = await prisma.payment.create({ data: { userId: user.id, amount, address: user.payoutAddress, status: 'PENDING' } });

  if (!solana.isLive()) {
    const done = await prisma.payment.update({ where: { id: payment.id }, data: { status: 'SIMULATED', note: 'no vault key configured — no SOL moved' } });
    return { payment: done };
  }

  try {
    const { signature, confirmed } = await solana.sendLamports(user.payoutAddress, amount);
    let landed = confirmed;
    if (!confirmed) landed = (await solana.signatureLanded(signature)) === 'landed';
    if (landed) {
      const done = await prisma.payment.update({ where: { id: payment.id }, data: { status: 'COMPLETED', signature } });
      await prisma.vaultEvent.create({ data: { type: 'PAYOUT', amount: -amount, note: `paid @${user.xUsername}` } });
      return { payment: done };
    }
    // Ambiguous: broadcast but not confirmed. Hold the balance; the reconcile cron finalizes.
    const held = await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PENDING', signature, note: 'awaiting on-chain confirmation' } });
    return { payment: held, pending: true };
  } catch (e) {
    // Pre-broadcast failure (no signature) → safe to refund.
    await prisma.user.update({ where: { id: user.id }, data: { balance: { increment: amount } } });
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', note: e.message } });
    return { error: 'transfer failed to broadcast — balance refunded' };
  }
}

app.post('/api/payout', requireAuth, async (req, res) => {
  const result = await executePayout(req.user);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ payment: result.payment, pending: !!result.pending, user: await meResponse(req.user.id) });
});

app.get('/api/payments', requireAuth, async (req, res) => {
  const payments = await prisma.payment.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20 });
  res.json({ payments: payments.map((p) => ({ ...p, amount: Math.round(p.amount), explorer: p.signature ? txExplorer(p.signature) : null })) });
});

app.get('/api/vault', async (_req, res) => {
  let balance = null;
  try { balance = await solana.getVaultBalance(); } catch { balance = null; }
  const [events, paid, owed] = await Promise.all([
    prisma.vaultEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 12 }),
    prisma.payment.aggregate({ where: { status: { in: ['COMPLETED', 'SIMULATED'] } }, _sum: { amount: true } }),
    prisma.user.aggregate({ _sum: { balance: true } }),
  ]);
  res.json({
    mode: solana.isLive() ? 'live' : 'simulated',
    feeMode: pumpfun.enabled() ? 'live' : 'off',
    address: solana.vaultPubkey(),
    balance,
    totalPaid: Math.round(paid._sum.amount || 0),
    totalOwed: Math.round(owed._sum.balance || 0),
    events,
  });
});

// ---------- on-chain mint hook ----------
function mintOnChain(pass, user) {
  if (!mint.enabled()) return;
  mint.mintPass(pass, user.payoutAddress || null)
    .then((sig) => prisma.nftPass.update({ where: { id: pass.id }, data: { mintSig: sig } }))
    .then(() => console.log(`[mint] pass #${pass.id} minted on-chain`))
    .catch((e) => console.error(`[mint] pass #${pass.id} failed: ${e.message}`));
}

// ---------- crons ----------
// Each cron is wrapped so a slow run never overlaps the next tick (which would
// double-credit / double-refund). `locked` is a simple in-process mutex.
function guarded(fn) {
  let locked = false;
  return async () => { if (locked) return; locked = true; try { await fn(); } catch (e) { console.error('[cron]', e.message); } finally { locked = false; } };
}

// Re-poll engagement and credit growth at the FROZEN per-shill multiplier.
cron.schedule('*/10 * * * *', guarded(async () => {
  const cutoff = new Date(Date.now() - 48 * 3600_000);
  const stale = new Date(Date.now() - 30 * 60_000);
  const shills = await prisma.shillRecord.findMany({ where: { createdAt: { gte: cutoff }, lastPolledAt: { lte: stale } }, take: 50 });
  for (const s of shills) {
    try {
      const m = await twitter.fetchTweetPublic(s.tweetId);
      const total = Math.round(metricsToLamports(m) * s.mult); // frozen multiplier — no windfall
      // Claim this poll atomically (bump lastPolledAt with a guard) so an overlapping
      // run can't read the same stale earned and credit the delta twice.
      const claimed = await prisma.shillRecord.updateMany({ where: { id: s.id, lastPolledAt: s.lastPolledAt }, data: { lastPolledAt: new Date() } });
      if (claimed.count === 0) continue;
      const delta = Math.max(0, total - Math.round(s.earned));
      await prisma.$transaction([
        prisma.shillRecord.update({ where: { id: s.id }, data: { likes: m.likes, retweets: m.retweets, replies: m.replies, views: m.views, earned: { increment: delta } } }),
        ...(delta > 0 ? [prisma.user.update({ where: { id: s.userId }, data: { balance: { increment: delta }, lifetimeEarned: { increment: delta } } })] : []),
      ]);
    } catch (e) {
      await prisma.shillRecord.update({ where: { id: s.id }, data: { lastPolledAt: new Date() } }).catch(() => {});
      console.error(`[poll] ${s.tweetId}: ${e.message}`);
    }
  }
}));

// Reconcile PENDING live payouts against the chain (atomic claim before acting).
cron.schedule('*/5 * * * *', guarded(async () => {
  if (!solana.isLive()) return;
  const pend = await prisma.payment.findMany({ where: { status: 'PENDING', signature: { not: null } } });
  for (const p of pend) {
    const state = await solana.signatureLanded(p.signature);
    // Stuck 'unknown' for >30 min after a broadcast almost certainly means the
    // blockhash expired and the tx was dropped; refund so funds aren't lost.
    const age = Date.now() - new Date(p.createdAt).getTime();
    const drop = state === 'dropped' || (state === 'unknown' && age > 30 * 60_000);
    if (state === 'landed') {
      const won = await prisma.payment.updateMany({ where: { id: p.id, status: 'PENDING' }, data: { status: 'COMPLETED' } });
      if (won.count) await prisma.vaultEvent.create({ data: { type: 'PAYOUT', amount: -Math.round(p.amount), note: `reconciled payout ${p.id}` } });
    } else if (drop) {
      // Flip PENDING→FAILED atomically; only the winner refunds (no double-refund).
      const won = await prisma.payment.updateMany({ where: { id: p.id, status: 'PENDING' }, data: { status: 'FAILED', note: state === 'dropped' ? 'dropped on-chain — refunded' : 'unconfirmed >30m — refunded' } });
      if (won.count) await prisma.user.update({ where: { id: p.userId }, data: { balance: { increment: Math.round(p.amount) } } });
    }
  }
}));

// Auto-claim pump.fun creator fees into the vault (continuous funding).
cron.schedule('*/3 * * * *', guarded(async () => {
  if (!pumpfun.enabled()) return;
  const r = await pumpfun.claimFees();
  if (r && r.claimed > 0) {
    await prisma.vaultEvent.create({ data: { type: 'FEE_SWEEP', amount: r.claimed, note: `claimed creator fees ${r.signature.slice(0, 8)}…` } });
    console.log(`[fees] swept ${r.claimed} lamports`);
  }
}));

// Continuous distribution: pay every worker over the minimum, frequently.
cron.schedule('*/10 * * * *', guarded(async () => {
  if (process.env.AUTOPAY !== 'true') return;
  const users = await prisma.user.findMany({ where: { balance: { gte: MIN_PAYOUT_LAMPORTS }, payoutAddress: { not: null }, xVerified: true } });
  if (users.length) console.log(`[autopay] distributing to ${users.length} workers`);
  for (const u of users) {
    const r = await executePayout(u);
    if (r.error) console.error(`[autopay] @${u.xUsername}: ${r.error}`);
  }
}));

// Verify every WORN, on-chain-minted pass is still held by its wearer's payout
// wallet (or custodially by the vault). Sellers lose the boost automatically.
cron.schedule('*/15 * * * *', guarded(async () => {
  if (!das.enabled()) return;
  const wearers = await prisma.user.findMany({ where: { equippedPassId: { not: null } } });
  if (!wearers.length) return;
  const minted = new Map(
    (await prisma.nftPass.findMany({ where: { id: { in: wearers.map((u) => u.equippedPassId) }, mintSig: { not: null } } }))
      .map((p) => [p.id, p]),
  );
  const vault = solana.vaultPubkey();
  let vaultHeld = null;
  for (const u of wearers) {
    const pass = minted.get(u.equippedPassId);
    if (!pass) continue; // not minted on-chain yet — DB ownership is the truth
    try {
      if (u.payoutAddress && await das.holdsPass(u.payoutAddress, pass.id)) continue;
      if (vault) {
        if (vaultHeld === null) vaultHeld = await das.heldPassIds(vault);
        if (vaultHeld.has(pass.id)) continue; // custodial — vault holds it for the worker
      }
      await prisma.user.update({ where: { id: u.id }, data: { equippedPassId: null, nftBoost: 1.0 } });
      console.log(`[das] pass #${pass.id} left @${u.xUsername}'s wallet — boost removed`);
    } catch (e) {
      console.error('[das] verify skipped:', e.message); // never strip on a read error
    }
  }
}));

// ---------- serve the built frontend (single-origin production) ----------
const DIST = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get(/^(?!\/api|\/nft|\/health).*/, (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
  console.log('[web] serving built frontend from /frontend/dist');
}

app.listen(PORT, () => {
  console.log(`🦍 APEPLOYEE API on :${PORT} (${CLUSTER})`);
  console.log(`   X verify: proof-of-post (public) · oauth ${twitter.oauthLive() ? 'on' : 'off'} · payouts ${solana.isLive() ? 'LIVE' : 'SIM'} · mint ${mint.enabled() ? 'LIVE' : 'off'} · fees ${pumpfun.enabled() ? 'LIVE' : 'off'}`);
});
