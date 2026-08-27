// APEPLOYEE API v2 — X-account identity, no wallet connect.
// The market is rough. People need work.
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const twitter = require('./services/twitter');
const solana = require('./services/solana');
const nft = require('./services/nft');

const prisma = new PrismaClient();
const app = express();

const PORT = Number(process.env.PORT || 3001);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TICKER = process.env.TICKER || '$APE';
const TOKEN_NAME = process.env.TOKEN_NAME || 'Apeployee';
const DAILY_SHILL_CAP = Number(process.env.DAILY_SHILL_CAP || 20);
const MIN_PAYOUT_LAMPORTS = 5_000_000; // 0.005 SOL
const COOKIE = 'ape_session';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;
const CLUSTER = (process.env.SOLANA_RPC_URL || '').includes('devnet') ? 'devnet' : 'mainnet';
const txExplorer = (sig) => `https://solscan.io/tx/${sig}${CLUSTER === 'devnet' ? '?cluster=devnet' : ''}`;

// On-chain minting is optional; the server runs fine without the Metaplex deps.
let mint = { enabled: () => false };
try { mint = require('./services/mint'); } catch { /* not installed/configured */ }

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use('/nft/images', express.static(path.join(__dirname, '..', 'nft', 'output', 'images')));

// Collection-level metadata for the cNFT collection NFT.
app.get('/nft/collection.json', (_req, res) => {
  res.json({
    name: 'Apeployee Worker Pass',
    symbol: 'APEPLOYEE',
    description: 'Official employee credentials for APEPLOYEE — the memecoin that hires. 1000 numbered Worker Passes, auto-mined to workers, each boosting shill pay by tier.',
    image: `${PUBLIC_BASE_URL}/nft/images/263.png`,
    external_url: PUBLIC_BASE_URL,
  });
});

// Metaplex-standard metadata with absolute URLs — this is what the cNFT `uri`
// points at, so wallets and marketplaces can render the pass.
app.get('/nft/metadata/:num', (req, res) => {
  const num = String(req.params.num).replace(/\.json$/i, '');
  if (!/^\d{3,4}$/.test(num)) return res.status(400).json({ error: 'bad pass number' });
  try {
    const meta = JSON.parse(require('fs').readFileSync(path.join(__dirname, '..', 'nft', 'output', 'metadata', `${num}.json`), 'utf8'));
    meta.image = `${PUBLIC_BASE_URL}/nft/images/${num}.png`;
    meta.properties = meta.properties || {};
    meta.properties.files = [{ uri: meta.image, type: 'image/png' }];
    meta.external_url = PUBLIC_BASE_URL;
    res.json(meta);
  } catch {
    res.status(404).json({ error: 'no such pass' });
  }
});

// ---------- auth helpers ----------
const setSession = (res, userId) => {
  const token = jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie
    ? res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: 30 * 86400_000 })
    : null;
};

function readSession(req) {
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
    const token = readSession(req);
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

// Engagement -> integer lamports (before multipliers):
// like 10_000 (0.00001 SOL), retweet 20_000, reply 5_000, view 100.
function metricsToLamports(m) {
  return m.likes * 10_000 + m.retweets * 20_000 + m.replies * 5_000 + m.views * 100;
}
const applyMultipliers = (lamports, user) =>
  Math.round(lamports * rankInfo(user.apeRank).mult * user.nftBoost);

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
    mine: nft.mineProgress(u.totalShills),
    ...extra,
  };
}

// ---------- status ----------
app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/status', (_req, res) => {
  res.json({
    app: TOKEN_NAME,
    ticker: TICKER,
    xMode: twitter.oauthLive() ? 'live' : 'demo',
    xRead: twitter.readLive() ? 'live' : 'simulated',
    payoutMode: solana.isLive() ? 'live' : 'simulated',
    autopay: process.env.AUTOPAY === 'true',
    mineEvery: nft.MINE_EVERY,
    dailyShillCap: DAILY_SHILL_CAP,
  });
});

// ---------- auth ----------
app.post('/api/auth/demo', async (req, res) => {
  if (twitter.oauthLive()) return res.status(400).json({ error: 'X sign-in is enabled — use /api/auth/x/start' });
  const handle = String(req.body.handle || '').replace(/^@/, '').trim();
  if (!/^[A-Za-z0-9_]{2,15}$/.test(handle)) return res.status(400).json({ error: 'that does not look like an X handle' });
  const user = await prisma.user.upsert({
    where: { xUsername: handle },
    update: {},
    create: { xUsername: handle, demo: true },
  });
  setSession(res, user.id);
  res.json({ user: publicUser(user) });
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
      // If a demo account with this handle exists, upgrade it in place.
      user = await prisma.user.upsert({
        where: { xUsername: username },
        update: { xId, xVerified: true, demo: false },
        create: { xId, xUsername: username, xVerified: true },
      });
    }
    setSession(res, user.id);
    res.redirect(FRONTEND_URL);
  } catch (e) {
    console.error('[auth] x callback failed:', e.message);
    res.redirect(`${FRONTEND_URL}?auth_error=1`);
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.cookie(COOKIE, '', { httpOnly: true, maxAge: 0 });
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, async (req, res) => {
  const [passCount, topPass, applications] = await Promise.all([
    prisma.nftPass.count({ where: { ownerId: req.user.id } }),
    prisma.nftPass.findFirst({ where: { ownerId: req.user.id }, orderBy: { boost: 'desc' } }),
    prisma.application.findMany({ where: { userId: req.user.id }, include: { job: true } }),
  ]);
  res.json({
    user: publicUser(req.user, {
      passCount,
      topPass: nft.withImage(topPass),
      jobs: applications.map((a) => ({ role: a.job.role, title: a.job.title, emoji: a.job.emoji, status: a.status })),
    }),
  });
});

app.put('/api/me/payout', requireAuth, async (req, res) => {
  const address = String(req.body.address || '').trim();
  if (address && !solana.isValidAddress(address)) return res.status(400).json({ error: 'not a valid Solana address' });
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { payoutAddress: address || null } });
  res.json({ user: publicUser(user) });
});

// ---------- jobs ----------
app.get('/api/jobs/public', async (_req, res) => {
  const jobs = await prisma.job.findMany({ where: { active: true }, include: { _count: { select: { applications: true } } } });
  res.json({
    jobs: jobs.map((j) => ({
      id: j.id, role: j.role, emoji: j.emoji, title: j.title, description: j.description,
      perk: j.perk, hired: j._count.applications, myStatus: null,
    })),
  });
});

app.get('/api/jobs', requireAuth, async (req, res) => {
  const jobs = await prisma.job.findMany({
    where: { active: true },
    include: { _count: { select: { applications: true } } },
  });
  const mine = await prisma.application.findMany({ where: { userId: req.user.id } });
  const mineByJob = new Map(mine.map((a) => [a.jobId, a.status]));
  res.json({
    jobs: jobs.map((j) => ({
      id: j.id, role: j.role, emoji: j.emoji, title: j.title, description: j.description,
      perk: j.perk, hired: j._count.applications, myStatus: mineByJob.get(j.id) || null,
    })),
  });
});

app.post('/api/jobs/:id/apply', requireAuth, async (req, res) => {
  const job = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!job || !job.active) return res.status(404).json({ error: 'job not found' });
  const existing = await prisma.application.findUnique({
    where: { userId_jobId: { userId: req.user.id, jobId: job.id } },
  });
  if (existing) return res.status(400).json({ error: `you already work here as ${job.title}` });

  const firstJob = (await prisma.application.count({ where: { userId: req.user.id } })) === 0;
  const application = await prisma.application.create({ data: { userId: req.user.id, jobId: job.id, status: 'APELOYED' } });

  // Welcome pass: your first job comes with a guaranteed Common Worker Pass.
  let minedPass = null;
  if (firstJob) {
    minedPass = await nft.minePass(prisma, req.user.id, 'Common');
    if (minedPass) mintOnChain(minedPass, req.user);
  }

  res.json({
    application: { status: application.status, job: { title: job.title, emoji: job.emoji } },
    minedPass: nft.withImage(minedPass),
    message: `Congratulations — you are officially APELOYED as ${job.title}. Now get to work.`,
  });
});

// ---------- shills ----------
const TWEET_URL = /(?:x|twitter)\.com\/[^/]+\/status\/(\d{5,25})/i;

app.get('/api/shills', requireAuth, async (req, res) => {
  const shills = await prisma.shillRecord.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
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

    let metrics, text, simulated;
    if (twitter.readLive()) {
      const tweet = await twitter.fetchTweet(tweetId);
      if (req.user.xVerified && tweet.authorId !== req.user.xId) {
        return res.status(400).json({ error: 'that post is not from your X account — shill with your own posts' });
      }
      if (!tweet.text.toUpperCase().includes(TICKER.toUpperCase())) {
        return res.status(400).json({ error: `the post has to mention ${TICKER} — that is the whole job` });
      }
      metrics = tweet; text = tweet.text; simulated = false;
    } else {
      metrics = twitter.demoMetrics(tweetId, 0);
      text = `Working for my bags ${TICKER}. LFG.`;
      simulated = true;
    }

    const base = metricsToLamports(metrics);
    const earned = applyMultipliers(base, req.user);

    const result = await prisma.$transaction(async (tx) => {
      const shill = await tx.shillRecord.create({
        data: {
          tweetId, userId: req.user.id, text,
          likes: metrics.likes, retweets: metrics.retweets, replies: metrics.replies, views: metrics.views,
          earned, simulated, lastPolledAt: new Date(),
        },
      });
      const newShills = req.user.totalShills + 1;
      const newRank = rankFor(newShills);
      const user = await tx.user.update({
        where: { id: req.user.id },
        data: {
          totalShills: newShills,
          balance: { increment: earned },
          lifetimeEarned: { increment: earned },
          apeRank: newRank.name,
        },
      });
      let minedPass = null;
      if (newShills % nft.MINE_EVERY === 0) minedPass = await nft.minePass(tx, req.user.id);
      return { shill, user, minedPass, rankedUp: newRank.name !== req.user.apeRank ? newRank : null };
    });
    if (result.minedPass) mintOnChain(result.minedPass, req.user);

    res.json({
      shill: { ...result.shill, earned: Math.round(result.shill.earned) },
      earned: Math.round(earned),
      user: publicUser(result.user),
      minedPass: nft.withImage(result.minedPass),
      rankedUp: result.rankedUp,
    });
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'that post was already claimed — every post pays once' });
    console.error('[shill] submit failed:', e);
    res.status(500).json({ error: 'could not verify that post right now' });
  }
});

// ---------- NFT register ----------
app.get('/api/passes', requireAuth, async (req, res) => {
  const passes = await prisma.nftPass.findMany({ where: { ownerId: req.user.id }, orderBy: [{ boost: 'desc' }, { minedAt: 'desc' }] });
  res.json({ passes: passes.map(nft.withImage) });
});

app.get('/api/passes/registry', async (_req, res) => {
  const [byTier, minedByTier, recent] = await Promise.all([
    prisma.nftPass.groupBy({ by: ['tier'], _count: true }),
    prisma.nftPass.groupBy({ by: ['tier'], where: { ownerId: { not: null } }, _count: true }),
    prisma.nftPass.findMany({
      where: { ownerId: { not: null } },
      orderBy: { minedAt: 'desc' },
      take: 8,
      include: { owner: { select: { xUsername: true } } },
    }),
  ]);
  const mined = new Map(minedByTier.map((t) => [t.tier, t._count]));
  res.json({
    tiers: nft.TIER_ORDER.map((tier) => ({
      tier,
      total: byTier.find((t) => t.tier === tier)?._count || 0,
      mined: mined.get(tier) || 0,
    })),
    recent: recent.map((p) => ({ ...nft.withImage(p), owner: p.owner?.xUsername })),
  });
});

// Public registry browser: all 1000 passes, filterable, with owners + mint status.
app.get('/api/registry/passes', async (req, res) => {
  const perPage = 48;
  const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
  const where = {};
  if (typeof req.query.tier === 'string' && nft.TIER_ORDER.includes(req.query.tier)) where.tier = req.query.tier;
  if (req.query.mined === 'true') where.ownerId = { not: null };
  if (req.query.mined === 'false') where.ownerId = null;
  const [total, passes] = await Promise.all([
    prisma.nftPass.count({ where }),
    prisma.nftPass.findMany({
      where, orderBy: { id: 'asc' }, skip: (page - 1) * perPage, take: perPage,
      include: { owner: { select: { xUsername: true } } },
    }),
  ]);
  res.json({
    total, page, perPage,
    passes: passes.map((p) => ({ ...nft.withImage(p), owner: p.owner?.xUsername || null })),
  });
});

// Public proof feed: recent verified shills (with X links) and payouts (with tx links).
app.get('/api/feed', async (_req, res) => {
  const [shills, payments] = await Promise.all([
    prisma.shillRecord.findMany({
      orderBy: { createdAt: 'desc' }, take: 25,
      include: { user: { select: { xUsername: true, xVerified: true } } },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' }, take: 25,
      include: { user: { select: { xUsername: true } } },
    }),
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
      address: p.address, status: p.status, signature: p.signature,
      explorer: p.signature ? txExplorer(p.signature) : null, createdAt: p.createdAt,
    })),
  });
});

// ---------- leaderboard ----------
app.get('/api/leaderboard', async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { lifetimeEarned: 'desc' },
    take: 20,
    include: { passes: { orderBy: { boost: 'desc' }, take: 1 }, _count: { select: { passes: true } } },
  });
  res.json({
    leaders: users.map((u, i) => ({
      position: i + 1,
      handle: u.xUsername,
      verified: u.xVerified,
      rank: rankInfo(u.apeRank),
      lifetimeEarned: Math.round(u.lifetimeEarned),
      totalShills: u.totalShills,
      passCount: u._count.passes,
      avatar: u.passes[0] ? nft.passImageUrl(u.passes[0].id) : null,
    })),
  });
});

// ---------- payouts & vault ----------
async function executePayout(user) {
  const amount = Math.round(user.balance);
  if (amount < MIN_PAYOUT_LAMPORTS) return { error: `minimum payout is ${MIN_PAYOUT_LAMPORTS / 1e9} SOL` };
  if (!user.payoutAddress) return { error: 'set a payout address first (Profile → payout address)' };

  // Reserve the balance atomically so concurrent requests cannot double-pay.
  const reserved = await prisma.user.updateMany({
    where: { id: user.id, balance: { gte: amount } },
    data: { balance: { decrement: amount } },
  });
  if (reserved.count === 0) return { error: 'balance changed — try again' };

  try {
    let signature = null, status = 'SIMULATED';
    if (solana.isLive()) {
      signature = await solana.sendLamports(user.payoutAddress, amount);
      status = 'COMPLETED';
    }
    const payment = await prisma.payment.create({
      data: {
        userId: user.id, amount, address: user.payoutAddress, status, signature,
        note: status === 'SIMULATED' ? 'no vault key configured — no SOL moved' : null,
      },
    });
    await prisma.vaultEvent.create({ data: { type: 'PAYOUT', amount: -amount, note: `${status} → @${user.xUsername}` } });
    return { payment };
  } catch (e) {
    await prisma.user.update({ where: { id: user.id }, data: { balance: { increment: amount } } });
    await prisma.payment.create({ data: { userId: user.id, amount, address: user.payoutAddress, status: 'FAILED', note: e.message } });
    return { error: 'transfer failed — balance refunded' };
  }
}

app.post('/api/payout', requireAuth, async (req, res) => {
  const result = await executePayout(req.user);
  if (result.error) return res.status(400).json({ error: result.error });
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ payment: result.payment, user: publicUser(user) });
});

app.get('/api/payments', requireAuth, async (req, res) => {
  const payments = await prisma.payment.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 20 });
  res.json({ payments: payments.map((p) => ({ ...p, amount: Math.round(p.amount) })) });
});

app.get('/api/vault', async (_req, res) => {
  const [balance, events, paid] = await Promise.all([
    solana.getVaultBalance(),
    prisma.vaultEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 12 }),
    prisma.payment.aggregate({ where: { status: { in: ['COMPLETED', 'SIMULATED'] } }, _sum: { amount: true } }),
  ]);
  const owed = await prisma.user.aggregate({ _sum: { balance: true } });
  res.json({
    mode: solana.isLive() ? 'live' : 'simulated',
    address: solana.vaultPubkey(),
    balance,
    totalPaid: Math.round(paid._sum.amount || 0),
    totalOwed: Math.round(owed._sum.balance || 0),
    events,
  });
});

// Fire-and-forget on-chain mint of a freshly mined pass (no-op unless the
// Metaplex pipeline is configured). Owner's payout address gets the cNFT when
// set; otherwise the vault holds it in custody until they add one.
function mintOnChain(pass, user) {
  if (!mint.enabled()) return;
  mint.mintPass(pass, user.payoutAddress || null)
    .then((sig) => prisma.nftPass.update({ where: { id: pass.id }, data: { mintSig: sig } }))
    .then(() => console.log(`[mint] pass #${pass.id} minted on-chain`))
    .catch((e) => console.error(`[mint] pass #${pass.id} failed: ${e.message}`));
}

// ---------- crons ----------
// Re-poll engagement on recent shills and credit the earnings delta.
cron.schedule('*/10 * * * *', async () => {
  const cutoff = new Date(Date.now() - 48 * 3600_000);
  const stale = new Date(Date.now() - 30 * 60_000);
  const shills = await prisma.shillRecord.findMany({
    where: { createdAt: { gte: cutoff }, lastPolledAt: { lte: stale } },
    take: 50,
    include: { user: true },
  });
  for (const s of shills) {
    try {
      let m;
      if (s.simulated) {
        m = twitter.demoMetrics(s.tweetId, (Date.now() - s.createdAt.getTime()) / 60_000);
      } else if (twitter.readLive()) {
        m = await twitter.fetchTweet(s.tweetId);
      } else continue;
      const total = applyMultipliers(metricsToLamports(m), s.user);
      const delta = Math.max(0, total - Math.round(s.earned));
      await prisma.$transaction([
        prisma.shillRecord.update({
          where: { id: s.id },
          data: { likes: m.likes, retweets: m.retweets, replies: m.replies, views: m.views, earned: { increment: delta }, lastPolledAt: new Date() },
        }),
        prisma.user.update({ where: { id: s.userId }, data: { balance: { increment: delta }, lifetimeEarned: { increment: delta } } }),
      ]);
    } catch (e) {
      await prisma.shillRecord.update({ where: { id: s.id }, data: { lastPolledAt: new Date() } }).catch(() => {});
      console.error(`[poll] ${s.tweetId}: ${e.message}`);
    }
  }
});

// Daily auto-pay (opt-in via AUTOPAY=true): pays every worker over the minimum.
cron.schedule('0 12 * * *', async () => {
  if (process.env.AUTOPAY !== 'true') return;
  const users = await prisma.user.findMany({ where: { balance: { gte: MIN_PAYOUT_LAMPORTS }, payoutAddress: { not: null } } });
  console.log(`[autopay] paying ${users.length} workers`);
  for (const u of users) {
    const r = await executePayout(u);
    if (r.error) console.error(`[autopay] @${u.xUsername}: ${r.error}`);
  }
});

app.listen(PORT, () => {
  console.log(`🦍 APEPLOYEE API on :${PORT}`);
  console.log(`   X sign-in: ${twitter.oauthLive() ? 'LIVE' : 'DEMO (handle only)'} · tweet reads: ${twitter.readLive() ? 'LIVE' : 'SIMULATED'} · payouts: ${solana.isLive() ? 'LIVE' : 'SIMULATED'}`);
});
