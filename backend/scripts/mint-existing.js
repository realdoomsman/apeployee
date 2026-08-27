// Backfills on-chain mints for passes already assigned to workers but not yet
// minted (mintSig is null). Run after setup-nft.js and after setting the tree
// + collection env vars.  node scripts/mint-existing.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const mint = require('../services/mint');
const prisma = new PrismaClient();

async function main() {
  if (!mint.enabled()) throw new Error('minting not configured — run setup-nft.js and set NFT_MERKLE_TREE / NFT_COLLECTION_MINT first');
  const passes = await prisma.nftPass.findMany({
    where: { ownerId: { not: null }, mintSig: null },
    include: { owner: { select: { payoutAddress: true, xUsername: true } } },
    orderBy: { minedAt: 'asc' },
  });
  console.log(`minting ${passes.length} assigned passes on-chain…`);
  let ok = 0;
  for (const p of passes) {
    try {
      const sig = await mint.mintPass(p, p.owner.payoutAddress || null);
      await prisma.nftPass.update({ where: { id: p.id }, data: { mintSig: sig } });
      console.log(`  #${p.id} → @${p.owner.xUsername} ${p.owner.payoutAddress ? '' : '(vault custody)'} ✓`);
      ok++;
    } catch (e) {
      console.error(`  #${p.id} failed: ${e.message}`);
    }
  }
  console.log(`done: ${ok}/${passes.length} minted`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
