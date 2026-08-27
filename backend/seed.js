// Seeds the 7 monkey jobs and imports the 1000-pass NFT register from
// nft/output/manifest.json. Idempotent: run any number of times.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JOBS = [
  { role: 'BAG_WORKER', emoji: '💼', title: 'Bag Worker', description: 'Entry-level position. Hold the bags. Move the bags. Never drop the bags.', perk: 'Full-time bag benefits' },
  { role: 'MEME_MAKER', emoji: '🎨', title: 'Meme Maker', description: 'Craft dank, weapons-grade memes for the timeline. Portfolio: your camera roll.', perk: 'Unlimited creative bananas' },
  { role: 'SHILL_CAPTAIN', emoji: '📣', title: 'Shill Captain', description: 'Lead the shill fleet. Rally the troop. Every reply section is your ocean.', perk: 'Captain hat (spiritual)' },
  { role: 'REPLY_GUY', emoji: '💬', title: 'Reply Guy', description: 'First under every big account. "gm", "this", "few understand". You know the job.', perk: 'Thumb insurance included' },
  { role: 'CHART_WATCHER', emoji: '📈', title: 'Chart Watcher', description: 'Stare at the 1-minute candles so the rest of the troop can sleep.', perk: 'Free eye drops forever' },
  { role: 'VIBE_MANAGER', emoji: '🎧', title: 'Vibe Manager', description: 'Keep the community warm during red candles. Morale is a full-time job.', perk: 'Aux cord privileges' },
  { role: 'BANANA_ACCOUNTANT', emoji: '🍌', title: 'Banana Accountant', description: 'Track the treasury. Count the bananas. Audit the vault. Eat one occasionally.', perk: 'Calculator with big buttons' },
];

const TIER_BOOST = { Common: 1.05, Uncommon: 1.1, Rare: 1.2, Epic: 1.35, Legendary: 1.5 };

async function main() {
  for (const j of JOBS) {
    await prisma.job.upsert({ where: { role: j.role }, update: { ...j }, create: { ...j } });
  }
  console.log(`[seed] ${JOBS.length} jobs upserted`);

  const already = await prisma.nftPass.count();
  if (already >= 1000) {
    console.log(`[seed] NFT register already populated (${already} passes) — skipping import`);
    return;
  }
  const manifestPath = path.join(__dirname, '..', 'nft', 'output', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (already > 0) await prisma.nftPass.deleteMany({}); // partial import: start clean
  await prisma.nftPass.createMany({
    data: manifest.map((e) => ({
      id: e.id,
      tier: e.tier,
      boost: TIER_BOOST[e.tier],
      background: e.background,
      fur: e.fur,
      outfit: e.outfit,
      eyewear: e.eyewear,
      headwear: e.headwear,
      item: e.item,
    })),
  });
  console.log(`[seed] NFT register imported: ${manifest.length} Worker Passes`);
}

main().finally(() => prisma.$disconnect());
