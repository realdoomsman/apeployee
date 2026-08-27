// OWNED-BY-CLAUDE — Apeployee NFT collection generator. GLM: do not edit.
// Usage:
//   node generate.js --sample   -> renders one preview per tier into ./out/
//   node generate.js            -> renders all 300 into ../output/{images,metadata}
//                                  plus ../output/contact-sheet.png
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
const rand = mulberry32(0xA9E10);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// Pools are cumulative: each tier unlocks flashier traits on top of the last.
const POOLS = {
  Common: {
    background: ['XP Bliss', 'Office Gray', 'Jungle Office'],
    fur: ['Classic Brown', 'Dark Cocoa', 'Ash Gray'],
    outfit: ['Bare', 'White Collar', 'Hoodie'],
    eyewear: ['None', 'Round Glasses', 'Nerd Glasses'],
    headwear: ['None', 'Backwards Cap', 'Visor'],
    item: ['None', 'Banana', 'Coffee', 'Keyboard'],
  },
  Uncommon: { background: ['Sunset Grind'], outfit: ['Hawaiian'], eyewear: ['Sunglasses'], headwear: ['Headset'], item: ['Banana Phone'] },
  Rare: { background: ['Server Room'], outfit: ['Business Suit'], eyewear: ['Monocle'], headwear: ['Hard Hat', 'Party Hat'], item: ['Money Stack'] },
};

const TIERS = [
  { name: 'Common',    count: 150, boost: '1.05x' },
  { name: 'Uncommon',  count: 90,  boost: '1.10x' },
  { name: 'Rare',      count: 40,  boost: '1.20x' },
  { name: 'Epic',      count: 15,  boost: '1.35x' },
  { name: 'Legendary', count: 5,   boost: '1.50x' },
];

function poolFor(tier, key) {
  const chain = ['Common', 'Uncommon', 'Rare'];
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
    t.item = 'Money Stack';
    t.eyewear = pick(['None', 'Round Glasses', 'Nerd Glasses', 'Sunglasses', 'Monocle']);
  }
  return t;
}

function buildPlan() {
  const seen = new Set();
  const plan = [];
  for (const tier of TIERS) {
    for (let i = 0; i < tier.count; i++) {
      let t; let guard = 0;
      do {
        t = rollTraits(tier.name);
        var key = [t.background, t.fur, t.outfit, t.eyewear, t.headwear, t.item].join('|');
      } while (seen.has(key) && ++guard < 5000);
      if (seen.has(key)) throw new Error(`Could not find unique combo for ${tier.name}`);
      seen.add(key);
      plan.push({ tier: tier.name, boost: tier.boost, traits: t });
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

async function main() {
  const sampleMode = process.argv.includes('--sample');
  if (sampleMode) {
    const outDir = path.join(__dirname, 'out');
    fs.mkdirSync(outDir, { recursive: true });
    const samples = [
      { name: 'common',    t: { background: 'XP Bliss', fur: 'Classic Brown', outfit: 'White Collar', eyewear: 'Round Glasses', headwear: 'None', item: 'Keyboard' } },
      { name: 'uncommon',  t: { background: 'Sunset Grind', fur: 'Ash Gray', outfit: 'Hoodie', eyewear: 'Sunglasses', headwear: 'Headset', item: 'Banana Phone' } },
      { name: 'rare',      t: { background: 'Server Room', fur: 'Dark Cocoa', outfit: 'Business Suit', eyewear: 'Nerd Glasses', headwear: 'Hard Hat', item: 'Money Stack' } },
      { name: 'epic',      t: { background: 'Jungle Office', fur: 'Golden', outfit: 'Hawaiian', eyewear: 'Monocle', headwear: 'Party Hat', item: 'Banana' } },
      { name: 'legendary', t: { background: 'Golden Vault', fur: 'Silverback', outfit: 'Gold Suit', eyewear: 'Sunglasses', headwear: 'Crown', item: 'Money Stack' } },
      { name: 'plain',     t: { background: 'Office Gray', fur: 'Classic Brown', outfit: 'Bare', eyewear: 'None', headwear: 'Backwards Cap', item: 'Coffee' } },
    ];
    for (const s of samples) {
      await renderPNG(s.t, path.join(outDir, `${s.name}.png`), 1000);
      console.log(`sample: ${s.name}.png`);
    }
    return;
  }

  const imgDir = path.join(__dirname, '..', 'output', 'images');
  const metaDir = path.join(__dirname, '..', 'output', 'metadata');
  fs.mkdirSync(imgDir, { recursive: true });
  fs.mkdirSync(metaDir, { recursive: true });

  const plan = buildPlan();
  const manifest = [];
  for (let i = 0; i < plan.length; i++) {
    const id = i + 1;
    const num = String(id).padStart(3, '0');
    await renderPNG(plan[i].traits, path.join(imgDir, `${num}.png`), 1000);
    fs.writeFileSync(path.join(metaDir, `${num}.json`), JSON.stringify(metadata(id, plan[i]), null, 2));
    manifest.push({ id, tier: plan[i].tier, boost: plan[i].boost, ...plan[i].traits });
    if (id % 50 === 0) console.log(`rendered ${id}/300`);
  }
  fs.writeFileSync(path.join(__dirname, '..', 'output', 'manifest.json'), JSON.stringify(manifest, null, 2));

  // Contact sheet: 20 x 15 grid of 100px thumbs.
  const thumbs = [];
  for (let i = 0; i < 300; i++) {
    const num = String(i + 1).padStart(3, '0');
    const buf = await sharp(path.join(imgDir, `${num}.png`)).resize(100, 100).png().toBuffer();
    thumbs.push({ input: buf, left: (i % 20) * 100, top: Math.floor(i / 20) * 100 });
  }
  await sharp({ create: { width: 2000, height: 1500, channels: 3, background: '#1B2230' } })
    .composite(thumbs).png().toFile(path.join(__dirname, '..', 'output', 'contact-sheet.png'));
  console.log('done: 300 images + metadata + manifest + contact sheet');
}

main().catch((e) => { console.error(e); process.exit(1); });
