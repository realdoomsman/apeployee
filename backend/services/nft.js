// NFT register + mining engine. Passes come from nft/output (seeded into NftPass).
// Workers auto-mine passes as they work. A boost applies ONLY to the pass a worker
// is actively WEARING (User.equippedPassId); this service is the only writer of
// User.nftBoost + equippedPassId. On-chain cNFT minting attaches later via mintSig.

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
// Retries within a tier on collision before falling through tiers. If the worker
// is wearing nothing, auto-equips the new pass so first-timers aren't stuck at 1.0x.
// Returns the pass or null (collection mined out).
async function minePass(db, userId, guaranteeTier = null) {
  const want = guaranteeTier || rollTier();
  const start = TIER_ORDER.indexOf(want);
  const order = [...TIER_ORDER.slice(0, start + 1).reverse(), ...TIER_ORDER.slice(start + 1)];
  for (const tier of order) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const free = await db.nftPass.count({ where: { tier, ownerId: null } });
      if (free === 0) break; // this tier is exhausted — move to the next
      const skip = Math.floor(Math.random() * free);
      const pass = await db.nftPass.findFirst({ where: { tier, ownerId: null }, skip, orderBy: { id: 'asc' } });
      if (!pass) break;
      const claimed = await db.nftPass.updateMany({
        where: { id: pass.id, ownerId: null },
        data: { ownerId: userId, minedAt: new Date() },
      });
      if (claimed.count === 0) continue; // lost a race — retry this tier
      // Auto-equip only if the worker is currently wearing nothing.
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user && user.equippedPassId == null) {
        await db.user.update({ where: { id: userId }, data: { equippedPassId: pass.id, nftBoost: pass.boost } });
      }
      return db.nftPass.findUnique({ where: { id: pass.id } });
    }
  }
  return null; // whole collection mined out
}

// Recomputes nftBoost from the currently worn pass, validating ownership.
// Clears the equip if the worker no longer owns it. Returns the effective boost.
async function refreshBoost(db, userId) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return 1.0;
  if (user.equippedPassId != null) {
    const worn = await db.nftPass.findFirst({ where: { id: user.equippedPassId, ownerId: userId } });
    if (worn) {
      if (user.nftBoost !== worn.boost) await db.user.update({ where: { id: userId }, data: { nftBoost: worn.boost } });
      return worn.boost;
    }
  }
  // nothing valid worn
  if (user.nftBoost !== 1.0 || user.equippedPassId != null) {
    await db.user.update({ where: { id: userId }, data: { nftBoost: 1.0, equippedPassId: null } });
  }
  return 1.0;
}

// Equip (wear) a pass the worker owns, or pass null to take it off.
async function equip(db, userId, passId) {
  if (passId == null) {
    await db.user.update({ where: { id: userId }, data: { equippedPassId: null, nftBoost: 1.0 } });
    return { equippedPassId: null, nftBoost: 1.0 };
  }
  const pass = await db.nftPass.findFirst({ where: { id: passId, ownerId: userId } });
  if (!pass) throw new Error('you do not own that Worker Pass');
  await db.user.update({ where: { id: userId }, data: { equippedPassId: pass.id, nftBoost: pass.boost } });
  return { equippedPassId: pass.id, nftBoost: pass.boost };
}

const passImageUrl = (id) => `/nft/images/${String(id).padStart(3, '0')}.png`;
const withImage = (pass) => (pass ? { ...pass, image: passImageUrl(pass.id) } : pass);

function mineProgress(totalShills) {
  const done = totalShills % MINE_EVERY;
  return { current: done, needed: MINE_EVERY, remaining: MINE_EVERY - done };
}

module.exports = { MINE_EVERY, TIER_ORDER, minePass, refreshBoost, equip, passImageUrl, withImage, mineProgress };
