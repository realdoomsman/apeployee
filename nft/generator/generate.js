// OWNED-BY-CLAUDE — Apeployee NFT collection generator. GLM: do not edit.
// Usage:
//   node generate.js --sample   -> renders tier/trait previews into ./out/
//   node generate.js            -> initial run: 300 tokens. If ../output/manifest.json
//                                  already exists, EXTENDS the collection to 1000 by
//                                  adding ids 301-1000 (Season 2 traits), leaving
//                                  001-300 byte-identical.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { composeSVG } = require('./traits');

// Deterministic RNG so the collection is reproducible from the seed.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let rand = mulberry32(0xA9E10); // season 1 seed; season 2 reseeds below
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// Pools are cumulative: each tier unlocks flashier traits on top of the last.
// Season 2 additions: Beanie (common); Trading Floor, 3D Glasses, Hi-Vis Vest
// (uncommon); Moon Desk, Albino, Propeller Cap, Tracksuit (rare); Laser Eyes,
// Diamond (epic); Golden Banana (legendary item option).
const POOLS = {
  Common: {
    background: ['XP Bliss', 'Office Gray', 'Jungle Office'],
    fur: ['Classic Brown', 'Dark Cocoa', 'Ash Gray'],
    outfit: ['Bare', 'White Collar', 'Hoodie'],
    eyewear: ['None', 'Round Glasses', 'Nerd Glasses'],
    headwear: ['None', 'Backwards Cap', 'Visor', 'Beanie'],
    item: ['None', 'Banana', 'Coffee', 'Keyboard'],
  },
  Uncommon: {
    background: ['Sunset Grind', 'Trading Floor'],
    outfit: ['Hawaiian', 'Hi-Vis Vest'],
    eyewear: ['Sunglasses', '3D Glasses'],
    headwear: ['Headset'],
    item: ['Banana Phone'],
  },
  Rare: {
    background: ['Server Room', 'Moon Desk'],
    fur: ['Albino'],
    outfit: ['Business Suit', 'Tracksuit'],
    eyewear: ['Monocle'],
    headwear: ['Hard Hat', 'Party Hat', 'Propeller Cap'],
    item: ['Money Stack'],
  },
  Epic: {
    eyewear: ['Laser Eyes'],
    item: ['Diamond'],
  },
};

const LEGENDARY_EYEWEAR = ['None', 'Round Glasses', 'Nerd Glasses', 'Sunglasses', 'Monocle', 'Laser Eyes'];
const LEGENDARY_ITEMS = ['Money Stack', 'Golden Banana', 'Diamond'];

const BOOSTS = { Common: '1.05x', Uncommon: '1.10x', Rare: '1.20x', Epic: '1.35x', Legendary: '1.50x' };
const SEASON1 = { Common: 150, Uncommon: 90, Rare: 40, Epic: 15, Legendary: 5 };     // ids 001-300
const SEASON2 = { Common: 350, Uncommon: 210, Rare: 100, Epic: 30, Legendary: 10 };  // ids 301-1000

function poolFor(tier, key) {
  const chain = ['Common', 'Uncommon', 'Rare', 'Epic'];
  const upTo = tier === 'Epic' || tier === 'Legendary' ? chain.length : chain.indexOf(tier) + 1;
  let out = [];
  for (let i = 0; i < upTo; i++) out = out.concat(POOLS[chain[i]][key] || []);
  return out;
}

function rollTraits(tier) {
  const t = {
    background: pick(poolFor(tier, 'background')),
    fur: pick(poolFor(tier, 'fur')),
    outfit: pick(poolFor(tier, 'outfit')),
    eyewear: pick(poolFor(tier, 'eyewear')),
    headwear: pick(poolFor(tier, 'headwear')),
    item: pick(poolFor(tier, 'item')),
  };
  if (tier === 'Uncommon' || tier === 'Rare') {
    // Must visibly carry at least one trait its tier unlocked.
    const unlock = POOLS[tier];
    const keys = Object.keys(unlock);
    const has = keys.some((k) => unlock[k].includes(t[k]));
    if (!has) {
      const k = pick(keys);
      t[k] = pick(unlock[k]);
    }
  }
  // A banana held to the ear and a headset on the same ear don't mix.
  if (t.headwear === 'Headset' && t.item === 'Banana Phone') {
    t.headwear = pick(POOLS.Common.headwear);
  }
  if (tier === 'Epic') {
    t.fur = 'Golden';
  } else if (tier === 'Legendary') {
    t.fur = 'Silverback';
    t.background = 'Golden Vault';
    t.outfit = 'Gold Suit';
    t.headwear = 'Crown';
    t.eyewear = pick(LEGENDARY_EYEWEAR);
    t.item = pick(LEGENDARY_ITEMS);
  }
  return t;
}

const comboKey = (t) => [t.background, t.fur, t.outfit, t.eyewear, t.headwear, t.item].join('|');

function buildPlan(tierCounts, seen) {
  const plan = [];
  for (const [tier, count] of Object.entries(tierCounts)) {
    for (let i = 0; i < count; i++) {
      let t; let guard = 0;
      do {
        t = rollTraits(tier);
      } while (seen.has(comboKey(t)) && ++guard < 20000);
      if (seen.has(comboKey(t))) throw new Error(`Could not find unique combo for ${tier}`);
      seen.add(comboKey(t));
      plan.push({ tier, boost: BOOSTS[tier], traits: t });
    }
  }
  // Shuffle so tiers are scattered across token ids (deterministic).
  for (let i = plan.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [plan[i], plan[j]] = [plan[j], plan[i]];
  }
  return plan;
}

function metadata(id, entry) {
  const num = String(id).padStart(3, '0');
  return {
    name: `Apeployee Worker Pass #${num}`,
    symbol: 'APEPLOYEE',
    description:
      'Official Apeployee Worker Pass. The market is rough. People need work. ' +
      'Hold this pass in your wallet to boost your shill pay — auto-mined for Bag Workers on the job. ' +
      `Tier: ${entry.tier} (${entry.boost} pay boost).`,
    image: `${num}.png`,
    attributes: [
      { trait_type: 'Tier', value: entry.tier },
      { trait_type: 'Pay Boost', value: entry.boost },
      { trait_type: 'Background', value: entry.traits.background },
      { trait_type: 'Fur', value: entry.traits.fur },
      { trait_type: 'Outfit', value: entry.traits.outfit },
      { trait_type: 'Eyewear', value: entry.traits.eyewear },
      { trait_type: 'Headwear', value: entry.traits.headwear },
      { trait_type: 'Item', value: entry.traits.item },
    ],
    properties: { files: [{ uri: `${num}.png`, type: 'image/png' }], category: 'image' },
  };
}

async function renderPNG(traits, file, size) {
  const svg = composeSVG(traits);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
}

async function contactSheet(imgDir, total, file) {
  const cols = total > 300 ? 40 : 20;
  const rows = Math.ceil(total / cols);
  const thumbs = [];
  for (let i = 0; i < total; i++) {
    const num = String(i + 1).padStart(3, '0');
    const buf = await sharp(path.join(imgDir, `${num}.png`)).resize(100, 100).png().toBuffer();
    thumbs.push({ input: buf, left: (i % cols) * 100, top: Math.floor(i / cols) * 100 });
  }
  await sharp({ create: { width: cols * 100, height: rows * 100, channels: 3, background: '#1B2230' } })
    .composite(thumbs).png().toFile(file);
}

async function main() {
  const sampleMode = process.argv.includes('--sample');
  if (sampleMode) {
    const outDir = path.join(__dirname, 'out');
    fs.mkdirSync(outDir, { recursive: true });
    const samples = [
      { name: 's2-laser-epic',   t: { background: 'Trading Floor', fur: 'Golden', outfit: 'Business Suit', eyewear: 'Laser Eyes', headwear: 'None', item: 'Diamond' } },
      { name: 's2-albino-rare',  t: { background: 'Moon Desk', fur: 'Albino', outfit: 'Tracksuit', eyewear: 'None', headwear: 'Propeller Cap', item: 'Money Stack' } },
      { name: 's2-hivis',        t: { background: 'XP Bliss', fur: 'Dark Cocoa', outfit: 'Hi-Vis Vest', eyewear: '3D Glasses', headwear: 'Hard Hat', item: 'Coffee' } },
      { name: 's2-beanie',       t: { background: 'Office Gray', fur: 'Classic Brown', outfit: 'Hoodie', eyewear: 'Round Glasses', headwear: 'Beanie', item: 'Banana' } },
      { name: 's2-legendary',    t: { background: 'Golden Vault', fur: 'Silverback', outfit: 'Gold Suit', eyewear: 'Laser Eyes', headwear: 'Crown', item: 'Golden Banana' } },
    ];
    for (const s of samples) {
      await renderPNG(s.t, path.join(outDir, `${s.name}.png`), 1000);
      console.log(`sample: ${s.name}.png`);
    }
    return;
  }

  const outRoot = path.join(__dirname, '..', 'output');
  const imgDir = path.join(outRoot, 'images');
  const metaDir = path.join(outRoot, 'metadata');
  fs.mkdirSync(imgDir, { recursive: true });
  fs.mkdirSync(metaDir, { recursive: true });

  const manifestPath = path.join(outRoot, 'manifest.json');
  const existing = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
  const seen = new Set(existing.map((e) => comboKey(e)));
  const extending = existing.length > 0;
  const startId = existing.length + 1;
  if (extending) {
    if (existing.length !== 300) throw new Error(`Expected 300 existing, found ${existing.length}`);
    rand = mulberry32(0xA9E20); // season 2 seed
  }

  const plan = buildPlan(extending ? SEASON2 : SEASON1, seen);
  const manifest = existing.slice();
  for (let i = 0; i < plan.length; i++) {
    const id = startId + i;
    const num = String(id).padStart(3, '0');
    await renderPNG(plan[i].traits, path.join(imgDir, `${num}.png`), 1000);
    fs.writeFileSync(path.join(metaDir, `${num}.json`), JSON.stringify(metadata(id, plan[i]), null, 2));
    manifest.push({ id, tier: plan[i].tier, boost: plan[i].boost, ...plan[i].traits });
    if ((i + 1) % 100 === 0) console.log(`rendered ${i + 1}/${plan.length}`);
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  await contactSheet(imgDir, manifest.length, path.join(outRoot, 'contact-sheet.png'));
  console.log(`done: ${plan.length} new tokens (ids ${startId}-${startId + plan.length - 1}), total ${manifest.length}; manifest + contact sheet updated`);
}

main().catch((e) => { console.error(e); process.exit(1); });
