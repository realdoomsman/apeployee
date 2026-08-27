// NFT register + mining engine. Passes come from nft/output (seeded into NftPass).
// Workers auto-mine passes as they work; holding boosts pay. This service is the
// only writer of User.nftBoost. On-chain cNFT minting attaches later via mintSig.

const MINE_EVERY = 5; // a pass is mined every N accepted shills
const TIER_WEIGHTS = [
  ['Common', 70],
  ['Uncommon', 20],
  ['Rare', 7.5],
  ['Epic', 2],
  ['Legendary', 0.5],
];
const TIER_ORDER = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

function rollTier() {
  const total = TIER_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [tier, w] of TIER_WEIGHTS) {
    if ((r -= w) <= 0) return tier;
  }
  return 'Common';
}

// Mine one unowned pass to userId inside the given prisma client/transaction.
// Falls back through tiers if the rolled tier is sold out. Returns the pass or null.
async function minePass(db, userId, guaranteeTier = null) {
  const want = guaranteeTier || rollTier();
  const start = TIER_ORDER.indexOf(want);
  // try the rolled tier, then downward, then upward
  const order = [...TIER_ORDER.slice(0, start + 1).reverse(), ...TIER_ORDER.slice(start + 1)];
  for (const tier of order) {
    const free = await db.nftPass.count({ where: { tier, ownerId: null } });
    if (free === 0) continue;
    const skip = Math.floor(Math.random() * free);
    const pass = await db.nftPass.findFirst({ where: { tier, ownerId: null }, skip, orderBy: { id: 'asc' } });
    if (!pass) continue;
    // Guard against a concurrent mine of the same pass.
    const claimed = await db.nftPass.updateMany({
      where: { id: pass.id, ownerId: null },
      data: { ownerId: userId, minedAt: new Date() },
    });
    if (claimed.count === 0) continue;
    await recomputeBoost(db, userId);
    return db.nftPass.findUnique({ where: { id: pass.id } });
  }
  return null; // whole collection mined out
}

async function recomputeBoost(db, userId) {
  const best = await db.nftPass.findFirst({ where: { ownerId: userId }, orderBy: { boost: 'desc' } });
  const boost = best ? best.boost : 1.0;
  await db.user.update({ where: { id: userId }, data: { nftBoost: boost } });
  return boost;
}

const passImageUrl = (id) => `/nft/images/${String(id).padStart(3, '0')}.png`;

function withImage(pass) {
  return pass ? { ...pass, image: passImageUrl(pass.id) } : pass;
}

function mineProgress(totalShills) {
  const done = totalShills % MINE_EVERY;
  return { current: done, needed: MINE_EVERY, remaining: MINE_EVERY - done };
}

module.exports = { MINE_EVERY, TIER_ORDER, minePass, recomputeBoost, passImageUrl, withImage, mineProgress };
