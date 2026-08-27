// Read-only DAS (Digital Asset Standard) lookups via the configured RPC (Helius).
// Tells us which Worker Pass cNFTs a wallet ACTUALLY holds on-chain, so a pass
// bought on Magic Eden/Tensor carries its boost to the buyer — and a sold pass
// stops boosting the seller. Results are cached briefly to keep RPC use sane.
const RPC = process.env.SOLANA_RPC_URL || '';
const COLLECTION = (process.env.NFT_COLLECTION_MINT || '').trim();
const NAME_RE = /Apeployee Worker Pass #(\d{1,4})/;
const TTL = 60_000;

const cache = new Map(); // address -> { at, ids:Set<number> }

const enabled = () => Boolean(RPC && COLLECTION);

// Set of pass ids (1..1000) held by `address`, from the verified collection only.
async function heldPassIds(address, { fresh = false } = {}) {
  if (!enabled() || !address) return new Set();
  const hit = cache.get(address);
  if (!fresh && hit && Date.now() - hit.at < TTL) return hit.ids;

  const ids = new Set();
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 'apeployee-das', method: 'getAssetsByOwner',
        params: { ownerAddress: address, page, limit: 1000 },
      }),
    });
    if (!res.ok) throw new Error(`DAS HTTP ${res.status}`);
    const { result, error } = await res.json();
    if (error) throw new Error(error.message || 'DAS error');
    const items = (result && result.items) || [];
    for (const it of items) {
      if (it.burnt) continue;
      const inCollection = (it.grouping || []).some((g) => g.group_key === 'collection' && g.group_value === COLLECTION);
      if (!inCollection) continue; // only our verified collection — names outside it are untrusted
      const m = NAME_RE.exec((it.content && it.content.metadata && it.content.metadata.name) || '');
      if (m) ids.add(Number(m[1]));
    }
    if (items.length < 1000) break;
  }
  if (cache.size > 2000) cache.clear(); // unbounded-growth guard
  cache.set(address, { at: Date.now(), ids });
  return ids;
}

async function holdsPass(address, passId, opts) {
  return (await heldPassIds(address, opts)).has(passId);
}

module.exports = { enabled, heldPassIds, holdsPass };
