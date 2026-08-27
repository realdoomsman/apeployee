// X (Twitter) service. Two modes:
//  LIVE — TWITTER_CLIENT_ID/SECRET set: real OAuth 2.0 PKCE sign-in; with
//         TWITTER_BEARER_TOKEN also set, real tweet lookups.
//  DEMO — no credentials: handle-only sign-in and deterministic simulated
//         metrics, everywhere labeled as simulated.
const crypto = require('crypto');
const axios = require('axios');

const CLIENT_ID = process.env.TWITTER_CLIENT_ID || '';
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || '';
const BEARER = process.env.TWITTER_BEARER_TOKEN || '';
const CALLBACK = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3001/api/auth/x/callback';

const oauthLive = () => Boolean(CLIENT_ID && CLIENT_SECRET);
const readLive = () => Boolean(BEARER);

// state -> { verifier, expires }
const pending = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of pending) if (v.expires < now) pending.delete(k);
}, 60_000).unref();

function startAuth() {
  const state = crypto.randomBytes(16).toString('hex');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  pending.set(state, { verifier, expires: Date.now() + 10 * 60_000 });
  const url = 'https://x.com/i/oauth2/authorize?' + new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK,
    scope: 'tweet.read users.read offline.access',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return url;
}

async function handleCallback(code, state) {
  const entry = pending.get(state);
  if (!entry) throw new Error('unknown or expired oauth state');
  pending.delete(state);
  const tokenRes = await axios.post(
    'https://api.x.com/2/oauth2/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CALLBACK,
      code_verifier: entry.verifier,
      client_id: CLIENT_ID,
    }),
    { auth: { username: CLIENT_ID, password: CLIENT_SECRET } }
  );
  const access = tokenRes.data.access_token;
  const meRes = await axios.get('https://api.x.com/2/users/me', {
    headers: { Authorization: `Bearer ${access}` },
  });
  return { xId: meRes.data.data.id, username: meRes.data.data.username };
}

// Real tweet lookup: id -> { authorId, text, likes, retweets, replies, views }
async function fetchTweet(tweetId) {
  const res = await axios.get(`https://api.x.com/2/tweets/${tweetId}`, {
    headers: { Authorization: `Bearer ${BEARER}` },
    params: { 'tweet.fields': 'public_metrics,created_at,author_id,text' },
  });
  const t = res.data.data;
  if (!t) throw new Error('tweet not found');
  const m = t.public_metrics || {};
  return {
    authorId: t.author_id,
    text: t.text || '',
    createdAt: t.created_at,
    likes: m.like_count || 0,
    retweets: (m.retweet_count || 0) + (m.quote_count || 0),
    replies: m.reply_count || 0,
    views: m.impression_count || 0,
  };
}

// DEMO metrics: deterministic per tweet id so re-polling "grows" believably.
function demoMetrics(tweetId, ageMinutes) {
  const h = crypto.createHash('sha256').update(String(tweetId)).digest();
  const base = h[0] + h[1]; // 0..510 personality of the tweet
  const growth = Math.min(1, ageMinutes / 240); // matures over 4 hours
  const likes = Math.round((base * 2 + 20) * (0.35 + 0.65 * growth));
  return {
    likes,
    retweets: Math.round(likes * (0.12 + (h[2] % 20) / 100)),
    replies: Math.round(likes * (0.08 + (h[3] % 15) / 100)),
    views: Math.round(likes * (35 + (h[4] % 40))),
  };
}

module.exports = { oauthLive, readLive, startAuth, handleCallback, fetchTweet, demoMetrics };
