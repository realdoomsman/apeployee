// X (Twitter) service — REAL verification with no dev app, no API keys, no cost.
//
// We read individual tweets through the same public endpoint X's own embed widgets
// use (cdn.syndication.twimg.com). It returns the tweet text, the author's handle +
// numeric id, and engagement counts — everything needed to (a) prove a user owns an
// account (they post a one-time code, we read it back) and (b) verify each shill is
// really theirs and mentions the ticker. This never touches X's data/analytics API,
// so it has no per-read cost and isn't the "InfoFi" usage X restricted.
//
// OAuth 2.0 is kept as an OPTIONAL one-click upgrade if real X app creds are set.
const crypto = require('crypto');
const axios = require('axios');

const CLIENT_ID = process.env.TWITTER_CLIENT_ID || '';
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || '';
const CALLBACK = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3001/api/auth/x/callback';

const oauthLive = () => Boolean(CLIENT_ID && CLIENT_SECRET);

// ---- public tweet read (the real backbone) ----
function syndicationToken(id) {
  // X's widgets derive a token from the id; the endpoint also accepts arbitrary
  // tokens, but we compute the "real" one for resilience.
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '') || 'a';
}

async function fetchTweetPublic(tweetId) {
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${syndicationToken(tweetId)}&lang=en`;
  const res = await axios.get(url, {
    timeout: 10_000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ApeployeeBot/1.0)', Accept: 'application/json' },
    validateStatus: () => true,
  });
  const t = res.data;
  if (!t || typeof t !== 'object' || !t.user || !t.user.id_str) {
    throw new Error('tweet not found, deleted, or from a protected account');
  }
  // views may be a number, an object {count}, or an object without count.
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const viewsRaw = t.views && typeof t.views === 'object' ? t.views.count : (t.views ?? t.view_count);
  return {
    authorId: String(t.user.id_str),
    authorHandle: String(t.user.screen_name || ''),
    text: String(t.text || ''),
    createdAt: t.created_at || null,
    likes: num(t.favorite_count),
    replies: num(t.conversation_count ?? t.reply_count),
    retweets: num(t.retweet_count ?? t.quote_count),
    views: num(viewsRaw),
  };
}

// ---- optional OAuth 2.0 PKCE (one-click) ----
const pending = new Map();
setInterval(() => { const now = Date.now(); for (const [k, v] of pending) if (v.expires < now) pending.delete(k); }, 60_000).unref();

function startAuth() {
  const state = crypto.randomBytes(16).toString('hex');
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  pending.set(state, { verifier, expires: Date.now() + 10 * 60_000 });
  return 'https://x.com/i/oauth2/authorize?' + new URLSearchParams({
    response_type: 'code', client_id: CLIENT_ID, redirect_uri: CALLBACK,
    scope: 'tweet.read users.read offline.access', state,
    code_challenge: challenge, code_challenge_method: 'S256',
  });
}

async function handleCallback(code, state) {
  const entry = pending.get(state);
  if (!entry) throw new Error('unknown or expired oauth state');
  pending.delete(state);
  const tokenRes = await axios.post('https://api.x.com/2/oauth2/token',
    new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: CALLBACK, code_verifier: entry.verifier, client_id: CLIENT_ID }),
    { auth: { username: CLIENT_ID, password: CLIENT_SECRET } });
  const me = await axios.get('https://api.x.com/2/users/me', { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } });
  return { xId: me.data.data.id, username: me.data.data.username };
}

module.exports = { oauthLive, fetchTweetPublic, startAuth, handleCallback };
